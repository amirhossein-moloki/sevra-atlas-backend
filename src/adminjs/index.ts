/// <reference path="../types/adminjs.d.ts" />
import type { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AdminJSOptions } from 'adminjs';
import { config } from '../config';

/**
 * Initializes AdminJS and attaches it to the express app.
 * Using dynamic imports because AdminJS and its plugins are ESM.
 */
export async function initAdminJS(app: Express, prisma: PrismaClient) {
    console.log('Initializing AdminJS...');
    try {
        const { default: AdminJS } = await import('adminjs');
        const { default: AdminJSExpress } = await import('@adminjs/express');
        const { Resource, Database } = await import('@adminjs/prisma');
        const resources = await import('./resources.js');
        const { componentLoader } = await import('./component-loader.js');

        AdminJS.registerAdapter({ Resource, Database });

        // Prisma 5 metadata extraction helper
        interface PrismaInternal {
          _runtimeDataModel?: { models: Record<string, { name: string; fields: unknown[] }> };
          _baseDmmf?: { datamodel: { models: { name: string; fields: unknown[] }[] } };
        }
        const prismaInternal = prisma as unknown as PrismaInternal;
        const dmmf = prismaInternal._runtimeDataModel || prismaInternal._baseDmmf;
        let models: Record<string, { name: string; fields: unknown[] }> = {};

        if (prismaInternal._runtimeDataModel) {
            models = prismaInternal._runtimeDataModel.models;
        } else if (prismaInternal._baseDmmf) {
            models = Object.fromEntries(prismaInternal._baseDmmf.datamodel.models.map(m => [m.name, m]));
        }

        const getModelResource = (modelName: string, options: Record<string, unknown>) => {
            const modelMetadata = models[modelName];
            if (!modelMetadata) {
                console.warn(`Model metadata for ${modelName} not found in Prisma DMMF`);
                return {
                    resource: prisma[modelName.toLowerCase() as keyof typeof prisma],
                    options
                };
            }
            return {
                resource: {
                    model: {
                        name: modelName,
                        fields: modelMetadata.fields,
                    },
                    client: prisma,
                },
                options,
            };
        };

        const adminOptions: AdminJSOptions = {
            resources: [
                getModelResource('User', resources.userResource.options),
                getModelResource('Post', resources.postResource.options),
                getModelResource('Page', resources.pageResource.options),
                getModelResource('Comment', resources.commentResource.options),
            ],
            rootPath: '/backoffice',
            branding: {
                companyName: 'Sevra Atlas',
                logo: false,
                withMadeWithLove: false,
            },
            dashboard: {
                handler: async () => {
                    return { message: 'Welcome to Sevra Atlas Backoffice' };
                },
            },
            componentLoader,
        };

        const admin = new AdminJS(adminOptions);

        // Authentication logic
        const auth = {
            authenticate: async (email: string, password: string) => {
                const { default: bcrypt } = await import('bcrypt');
                const user = await prisma.user.findFirst({ where: { email } });
                if (user && user.role === 'ADMIN' && user.password) {
                    const matched = await bcrypt.compare(password, user.password);
                    if (matched) return user;
                }
                return null;
            },
            cookieName: 'adminjs',
            cookiePassword: config.admin.cookiePassword,
        };

        const router = AdminJSExpress.buildAuthenticatedRouter(
            admin,
            auth,
            null,
            {
                resave: false,
                saveUninitialized: false,
                secret: config.admin.sessionSecret,
                cookie: {
                    httpOnly: true,
                    secure: config.isProduction,
                },
            }
        );

        app.use(admin.options.rootPath, router);
        console.log(`AdminJS initialized at ${admin.options.rootPath}`);
        return admin;
    } catch (error) {
        console.error('Failed to initialize AdminJS:', error);
        return null;
    }
}
