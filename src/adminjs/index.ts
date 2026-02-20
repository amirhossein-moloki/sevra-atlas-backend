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
        const { default: AdminJS } = await (eval('import("adminjs")') as Promise<typeof import('adminjs')>);
        const { default: AdminJSExpress } = await (eval('import("@adminjs/express")') as Promise<typeof import('@adminjs/express')>);
        const { Resource, Database } = await (eval('import("@adminjs/prisma")') as Promise<typeof import('@adminjs/prisma')>);
        const resources = await import('./resources');
        const { componentLoader } = await import('./component-loader');

        AdminJS.registerAdapter({ Resource, Database });

        const getModelResource = (modelName: string, options: Record<string, unknown>) => {
            // Prisma model names in the client are usually lowercase (e.g. prisma.user)
            const modelDelegate = (prisma as any)[modelName.toLowerCase()] || (prisma as any)[modelName];

            if (!modelDelegate) {
                console.warn(`Model delegate for ${modelName} not found in Prisma client`);
            }

            return {
                resource: {
                    model: modelDelegate,
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
