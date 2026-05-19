import { AuthGate } from "@/components/auth/auth-gate";
import { GameClubApp } from "@/components/game-club/game-club-app";

export default function Home() {
  return (
    <AuthGate>
      <GameClubApp />
    </AuthGate>
  );
}
