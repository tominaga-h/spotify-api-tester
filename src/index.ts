import { config } from "dotenv";
import { getSpotifyApiClient } from "./api.js";

config({ path: ".env", quiet: true });

async function main() {

  const apiClient = getSpotifyApiClient();

  // const result = await apiClient.search("The Beatles", ["artist"]);
  const result = await apiClient.player.getCurrentlyPlayingTrack("ES");
  // const result = await apiClient.currentUser.profile();
  console.log(result);
}

main();
