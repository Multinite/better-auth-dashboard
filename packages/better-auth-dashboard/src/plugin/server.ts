import type { BetterAuthPlugin } from "better-auth";
import {
  APIError,
  createAuthEndpoint,
  getSessionFromCtx,
  getEndpoints,
} from "better-auth/api";

type DashboardPluginConfig = {
  /**
   * The index where the dashboard plugin must insert itself in the array.
   * @default 0
   */
  pluginInsertPosition?: number;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const dashboardPluginWrapper = <PluginsArr extends any[]>(
  plugins: PluginsArr,
  config: DashboardPluginConfig = {}
): [ReturnType<DashboardPlugin>, ...PluginsArr] => {
  const { pluginInsertPosition = 0 } = config;
  plugins.splice(pluginInsertPosition, 0, dashboardPlugin(config, { plugins }));
  return plugins;
};

type InternalConfig = {
  plugins: BetterAuthPlugin[];
};

export type DashboardPlugin = typeof dashboardPlugin;

export function dashboardPlugin(config: DashboardPluginConfig) {

  const plugin: BetterAuthPlugin = {
    id: "better-auth-dashboard",
    schema: {
      routeProtection: {
        fields: {
          route: {
            type: "string",
            unique: true,
            required: true,
            input: true,
          },
          isRoleProtected: {
            type: "boolean",
            input: true,
            required: true,
          },
          roleProtection: {
            type: "string",
            input: true,
            required: true,
          },
          isAuthenticatedProtected: {
            type: "boolean",
            input: true,
            required: true,
          },
        },
      },
    },
    endpoints: {
      routeProtection: createAuthEndpoint(
        "/dashboard/route-protection",
        {
          method: "GET",
        },
        async (ctx) => {
          const session = await getSessionFromCtx(ctx);

          if (!session || session.user.role != "admin") {
            throw new APIError("UNAUTHORIZED", {
              message: `Invalid or missing session.`,
            });
          }

          return ctx.json({
            message: "Hello World",
          });
        }
      ),
      getEndpoints: createAuthEndpoint(
        `/dashboard/get-endpoints`,
        {
          method: "GET",
        },
        async (ctx) => {
          const session = await getSessionFromCtx(ctx);

          if (!session || session.user.role != "admin") {
            throw new APIError("UNAUTHORIZED", {
              message: `Invalid or missing session.`,
            });
          }

          const endpoints = getEndpoints(ctx.context, ctx.context.options);
          const paths: string[] = endpoints.middlewares.map((x) => x.path);
          return ctx.json({
            paths,
          });
        }
      ),
    },
  };

  return plugin;
}

function hasAdminPlugin(plugins: BetterAuthPlugin[]) {
  return Boolean(plugins.find((x) => x.id === "admin"));
}