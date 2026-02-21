import type { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AdminJSOptions } from 'adminjs';
import { config } from '../config';

/**
 * Initializes AdminJS and attaches it to the express app.
 * Using dynamic imports because AdminJS and its plugins are ESM.
 */
export async function initAdminJS(app: Express, prisma: PrismaClient) {
    if (config.worker.isWorker) {
        return null;
    }

    console.log('Initializing AdminJS...');
    try {
        const { default: AdminJS } = await (eval('import("adminjs")') as Promise<any>);
        const { default: AdminJSExpress } = await (eval('import("@adminjs/express")') as Promise<any>);
        const { Resource, Database, getModelByName } = await (eval('import("@adminjs/prisma")') as Promise<any>);

        AdminJS.registerAdapter({ Resource, Database });

        // Use factory functions for ESM/CJS compatibility
        const { createComponentLoader } = await import('./component-loader');
        const { createResources } = await import('./resources');

        const { componentLoader, COMPONENTS } = await createComponentLoader();
        const resources = createResources(prisma, COMPONENTS, getModelByName);

        const adminOptions: AdminJSOptions = {
            resources: [
                resources.adminResource,
                resources.userResource,
                resources.postResource,
                resources.pageResource,
                resources.commentResource,
            ],
            rootPath: '/backoffice',
            loginPath: '/backoffice/login',
            logoutPath: '/backoffice/logout',
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
            locale: {
                language: 'en',
                translations: {
                    labels: {
                        loginWelcome: 'Sevra Atlas Backoffice',
                    },
                    properties: {
                        email: 'Username',
                    },
                },
            },
        };

        const admin = new AdminJS(adminOptions);

        // Authentication logic
        const auth = {
            authenticate: async (username: string, password: string) => {
                const { default: bcrypt } = await import('bcrypt');
                const user = await prisma.user.findFirst({
                    where: { username }
                });
                if (user && ['ADMIN', 'SUPER_ADMIN'].includes(user.role) && user.password) {
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
            {
                ...auth,
                loginPath: '/backoffice/login',
                logoutPath: '/backoffice/logout',
            },
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
