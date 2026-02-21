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
        const { getDashboardData } = await import('./handlers/dashboard.handler');

        const adminOptions: AdminJSOptions = {
            resources: [
                resources.adminResource,
                resources.userResource,
                resources.postResource,
                resources.pageResource,
                resources.commentResource,
                resources.salonResource,
                resources.artistResource,
                resources.paymentResource,
                resources.verificationResource,
                resources.auditLogResource,
            ],
            rootPath: '/backoffice',
            loginPath: '/backoffice/login',
            logoutPath: '/backoffice/logout',
            branding: {
                companyName: 'Sevra Atlas Enterprise',
                logo: false,
                withMadeWithLove: false,
                theme: {
                    colors: {
                        primary100: '#4263eb',
                        accent: '#4263eb',
                        love: '#e03131',
                    },
                },
            },
            dashboard: {
                handler: async () => {
                    return await getDashboardData(prisma);
                },
                component: COMPONENTS.Dashboard,
            },
            componentLoader,
            locale: {
                language: 'en',
                translations: {
                    labels: {
                        loginWelcome: 'Sevra Atlas Backoffice',
                    },
                    properties: {
                        email: 'Username, Email or Phone',
                    },
                },
            },
        };

        const admin = new AdminJS(adminOptions);

        if (config.isProduction) {
            console.log('Bundling AdminJS assets...');
            await admin.initialize();
        } else {
            admin.watch();
        }

        const { RedisStore } = await (eval('import("connect-redis")') as Promise<any>);
        const { redisSession } = await import('../shared/redis/redis');

        const store = new RedisStore({
            client: redisSession,
            prefix: 'adminjs_session:',
        });

        // Authentication logic
        const auth = {
            authenticate: async (identifier: string, password: string) => {
                const { default: bcrypt } = await import('bcrypt');
                const user = await prisma.user.findFirst({
                    where: {
                        OR: [
                            { username: identifier },
                            { email: identifier },
                            { phoneNumber: identifier },
                        ],
                    }
                });
                if (user && ['ADMIN', 'SUPER_ADMIN'].includes(user.role) && user.password) {
                    const matched = await bcrypt.compare(password, user.password);
                    if (matched) {
                        // Return session-safe user object without BigInt
                        return {
                            id: user.id.toString(),
                            email: user.email,
                            role: user.role,
                        };
                    }
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
                store,
                name: 'adminjs.sid', // Distinct cookie name
                cookie: {
                    httpOnly: true,
                    secure: config.isProduction,
                    sameSite: 'lax',
                    maxAge: 24 * 60 * 60 * 1000, // 24 hours
                },
                proxy: config.isProduction, // Required for secure cookies behind proxy
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
