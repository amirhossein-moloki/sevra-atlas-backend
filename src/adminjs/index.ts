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
        const { default: AdminJS } = await (eval('import("adminjs")') as Promise<any>);
        const { default: AdminJSExpress } = await (eval('import("@adminjs/express")') as Promise<any>);
        const { Resource, Database } = await (eval('import("@adminjs/prisma")') as Promise<any>);

        // Use factory functions for ESM/CJS compatibility
        const { createComponentLoader } = await import('./component-loader');
        const { createResources } = await import('./resources');

        const { componentLoader, COMPONENTS } = await createComponentLoader();
        const resources = createResources(COMPONENTS);

        AdminJS.registerAdapter({ Resource, Database });

        const adminOptions: AdminJSOptions = {
            resources: [
                resources.userResource,
                resources.postResource,
                resources.pageResource,
                resources.commentResource,
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
