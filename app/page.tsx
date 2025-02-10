"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Home() {

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const [username, setUsername] = useState("");
  const [storedUsername, setStoredUsername] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectingDifficulty, setSelectingDifficulty] = useState(false);
  const [difficulty, setDifficulty] = useState(null);
  const [gameStatus, setGameStatus] = useState(null);
  const router = useRouter();

  // Check localStorage for user, game status, and game ID
  useEffect(() => {
    const savedUsername = localStorage.getItem("username");
    const savedGameId = localStorage.getItem("gameId");
    const savedGameStatus = localStorage.getItem("gameStatus");

    if (savedUsername) {
      setStoredUsername(savedUsername);
      fetchHistory(savedUsername);
    }

    if (savedGameId && savedGameStatus === "IN_PROGRESS") {
      setGameStatus("IN_PROGRESS");
    }
  }, []);

  // Function to register user
  const handleRegister = async () => {
    if (!username.trim()) {
      alert("Username cannot be empty.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(apiUrl+"/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("username", data.username);
        setStoredUsername(data.username);
        fetchHistory(data.username);
      } else {
        alert(data.error || "Registration failed.");
      }
    } catch (error) {
      alert("An error occurred. Please try again.");
    }
    setLoading(false);
  };

  // Fetch game history
  const fetchHistory = async (username) => {
    try {
      const response = await fetch(`${apiUrl}/game/history?username=${username}`);
      const data = await response.json();
      if (response.ok) {
        setHistory(data || []);
      } else {
        setHistory([]);
      }
    } catch (error) {
      setHistory([]);
    }
  };

  // Function to start difficulty selection
  const startGameSelection = () => {
    setSelectingDifficulty(true);
  };

  // Function to select a difficulty level
  const selectDifficulty = (level) => {
    setDifficulty(level);
  };

  // Function to start a new game
  const confirmStartGame = async () => {
    if (!difficulty) {
      alert("Please select a difficulty level.");
      return;
    }
    try {
      const obj = { username: storedUsername, difficulty: difficulty.toUpperCase() };
      const response = await fetch(apiUrl+"/game/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(obj),
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("gameId", data.game_id);
        localStorage.setItem("accessToken", data.access_token);
        localStorage.setItem("gameStatus", "IN_PROGRESS");
        localStorage.setItem("attemptsLeft", data.attempts_left);
        localStorage.setItem("difficulty", data.difficulty);

        if (localStorage.getItem("accessToken")) {
          fetchCurrentRiddle(data.game_id);
          router.push("/map");
        } else {
          alert("Failed to start the game.");
        }
      } else {
        alert(data.error && "Failed to start the game.");
      }
    } catch (error) {
      alert("An error occurred. Please try again.");
    }
  };

  // Fetch the current riddle when a game starts or continues
  const fetchCurrentRiddle = async (gameId) => {
    try {
      const response = await fetch(`${apiUrl}/game/${gameId}/riddle`, {
        method: "GET",
        headers: { "Authorization": localStorage.getItem("accessToken") || "Bearer 3" },
      });

      const data = await response.json();
      console.log("Next riddle:", data);
      if (response.ok && data) {
        localStorage.setItem("currentRiddle", JSON.stringify(data));
        const storedRiddles = JSON.parse(localStorage.getItem("riddles")) || [];
        localStorage.setItem("riddles", JSON.stringify([...storedRiddles, data]));

        window.dispatchEvent(new Event("storage"));
      }
    } catch (error) {
      alert("An error occurred. Please try again.");
    }
  };

  const deleteGame = async (gameId: any) => {
    try {
      const response = await fetch(`${apiUrl}/game/${gameId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (response.ok) {
        console.log(data);
        alert(data.message);
        console.log(parseInt(gameId) === parseInt(localStorage.getItem("gameId") || "0"));
        if (parseInt(gameId) === parseInt(localStorage.getItem("gameId") || "0")) {
          localStorage.removeItem("currentRiddle");
          localStorage.removeItem("riddles");
          localStorage.removeItem("answers");
          localStorage.removeItem("gameId");
          localStorage.removeItem("accessToken");
          window.location.reload();
        }
        fetchHistory(storedUsername);
      }
    } catch (error) {
      alert("An error occurred. Please try again.");
    }
  }

  // Continue an existing game
  const continueGame = () => {
    router.push("/map");
  };

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-white bg-opacity-50">
      <SidebarTrigger className="absolute top-4 left-4 z-10" />

      {/* If the user is already registered */}
      {storedUsername ? (
        <div className="text-center">
          <h1 className="font-bold text-3xl mb-4">Hello, {storedUsername}!</h1>

          {/* If there is an ongoing game, show "Continue Game" */}
          {gameStatus === "IN_PROGRESS" ? (
            <Button onClick={continueGame}>Continue Game</Button>
          ) : !selectingDifficulty ? (
            <Button onClick={startGameSelection}>Start a Game</Button>
          ) : (
            <div className="mt-6">
              <h2 className="font-semibold text-xl mb-2">Select Difficulty</h2>
              <div className="flex justify-center gap-4">
                {["easy", "medium", "hard"].map((level) => (
                  <Button
                    key={level}
                    onClick={() => selectDifficulty(level)}
                    className={`px-4 py-2 border rounded ${difficulty === level ? "bg-blue-500 text-white" : "bg-gray-200"
                      }`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Button>
                ))}
              </div>

              {difficulty && (
                <p className="mt-4 text-sm text-gray-600">
                  {difficulty === "easy" && "You have 10 attempts and 3 riddles."}
                  {difficulty === "medium" && "You have 7 attempts and 4 riddles."}
                  {difficulty === "hard" && "You have 5 attempts and 5 riddles."}
                </p>
              )}

              <Button onClick={confirmStartGame} className="mt-4" disabled={!difficulty}>
                Start
              </Button>
            </div>
          )}

          {/* Game history */}
          <div className="mt-6 w-full max-w-md">
            <h2 className="font-semibold text-xl">Game History</h2>
            {history.length > 0 ? (
              <table className="w-full mt-2 border border-gray-300">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border p-2">Game ID</th>
                    <th className="border p-2">Status</th>
                    <th className="border p-2">Attempts Left</th>
                    <th className="border p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((game) => (
                    <tr key={game.gameId}>
                      <td className="border p-2">{game.gameId}</td>
                      <td className="border p-2">{game.status}</td>
                      <td className="border p-2">{game.attemptsLeft}</td>
                      <td className="border p-2">
                        <Button onClick={() => deleteGame(game.gameId)} className="mt-4 bg-red-800">Delete</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500 mt-2">No history available.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <h1 className="font-bold text-3xl">Treasure Hunting</h1>
          <div className="flex w-full max-w-sm items-center space-x-2 pt-10">
            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Button onClick={handleRegister} disabled={loading}>
              {loading ? "Registering..." : "Register"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
