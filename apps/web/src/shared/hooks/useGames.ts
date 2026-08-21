import { useQuery } from "@tanstack/react-query";
import { toGameManifest } from "@/shared/api/catalog";
import { fetchGames } from "@/shared/api/games";

export function useGames() {
  return useQuery({
    queryKey: ["games"],
    queryFn: fetchGames,
    select: (games) => games.map(toGameManifest),
  });
}

export function useGame(gameId: string | undefined) {
  const query = useGames();
  return {
    ...query,
    game: query.data?.find((game) => game.id === gameId),
  };
}
