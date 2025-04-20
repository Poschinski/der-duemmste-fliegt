import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("lobby/:gameId", "./routes/createGame.tsx"),
  route("game/:gameId", "./routes/game.tsx"),
  route("joinGame/:gameId", "./routes/joinGame.tsx"),
] satisfies RouteConfig;
