"use client";
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input"; // ShadCN Input
import { Button } from "@/components/ui/button"; // ShadCN Button
import React from "react";

const MapComponent = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentRiddle, setCurrentRiddle] = useState(null);
    const [searchQuery, setSearchQuery] = useState(""); // User's search input
    const [searchResults, setSearchResults] = useState([]); // List of geocoding results
    const [attemptsLeft, setAttemptsLeft] = useState(null);
    const mapRef = useRef(null);
    const isThereAMarker = useRef(false);
    const mapInstance = useRef<L.Map | null>(null);
    const [correctAnswer, setCorrectAnswer] = useState(null); // Store correct answer for dialog

    const accessToken = process.env.NEXT_PUBLIC_ACCESS_TOKEN;

    // Load current riddle from localStorage when component mounts
    useEffect(() => {
        if (typeof window !== "undefined") {
            const storedRiddle = JSON.parse(localStorage.getItem("currentRiddle") || "null");
            if (storedRiddle) {
                setCurrentRiddle(storedRiddle);
            }
        }
    }, []);

    useEffect(() => {
        if (!currentRiddle) return;

        // Initialize the map
        mapInstance.current = L.map("map", { zoomControl: false }).setView(
            [48.7965913, 2.3210938],
            6
        );

        // Add the tile layer
        L.tileLayer(
            `https://tile.jawg.io/jawg-sunny/{z}/{x}/{y}.png?access-token=${accessToken}`,
            {
                maxZoom: 22,
                attribution: '<a href="https://jawg.io" title="Tiles Courtesy of Jawg Maps" target="_blank" class="jawg-attrib">&copy; <b>Jawg</b>Maps</a> | <a href="https://www.openstreetmap.org/copyright" title="OpenStreetMap is open data licensed under ODbL" target="_blank" class="osm-attrib">&copy; OSM contributors</a>',
                zoomControl: false,
            }
        ).addTo(mapInstance.current);

        L.control.zoom({ position: "bottomright" }).addTo(mapInstance.current);

        const storedAnswers = JSON.parse(localStorage.getItem("answers") || "[]");
        storedAnswers.forEach((answer, index) => {
            L.marker([answer.lat, answer.lng])
                .addTo(mapInstance.current)
                .bindPopup(`Riddle ${index + 1}`);
        });

        // Handle map click
        mapInstance.current.on("click", async (e) => {
            const clickedPoint = e.latlng;
            console.log("Clicked point:", clickedPoint);

            try {
                // Send API request to validate answer
                const response = await fetch(apiUrl + "/game/" + localStorage.getItem('gameId') + "/answer", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": localStorage.getItem("accessToken") || "",
                    },
                    body: JSON.stringify({
                        latitude: clickedPoint.lat,
                        longitude: clickedPoint.lng,
                    }),
                });

                const data = await response.json();
                console.log("Answer check response:", data);
                localStorage.setItem("attemptsLeft", data.attempts_left);
                setAttemptsLeft(data.attempts_left);

                if (data.solved) {
                    console.log("Correct answer!");
                    setCorrectAnswer(clickedPoint);
                    setIsDialogOpen(true);

                    const storedAnswers = JSON.parse(localStorage.getItem("answers") || "[]");
                    storedAnswers.push({ lat: clickedPoint.lat, lng: clickedPoint.lng });
                    localStorage.setItem("answers", JSON.stringify(storedAnswers));
                    localStorage.setItem("gameStatus", data.status);

                    L.marker([clickedPoint.lat, clickedPoint.lng])
                        .addTo(mapInstance.current)
                        .bindPopup(`Riddle ${storedAnswers.length}`)
                        .openPopup();

                } else {
                    alert("Incorrect location! Try again.");
                }

                if (data.status === "COMPLETED") {
                    alert("Congratulations! You have completed the game.");
                    localStorage.removeItem("currentRiddle");
                    localStorage.removeItem("riddles");
                    localStorage.removeItem("answers");
                    localStorage.removeItem("gameId");
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("attemptsLeft");
                    localStorage.removeItem("gameStatus");
                    localStorage.removeItem("difficulty");
                    window.location.href = "/";
                }

                if (data.attempts_left <= 0) {
                    alert("Game Over");
                    localStorage.removeItem("currentRiddle");
                    localStorage.removeItem("riddles");
                    localStorage.removeItem("answers");
                    localStorage.removeItem("gameId");
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("attemptsLeft");
                    localStorage.removeItem("gameStatus");
                    localStorage.removeItem("difficulty");
                    window.location.href = "/";
                }


                fetchCurrentRiddle(localStorage.getItem("gameId"));
            } catch (error) {
                console.error("Error checking riddle answer:", error);
            }
        });

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
            }
        };
    }, [currentRiddle]);

    // Fetch next riddle after solving the current one
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

                const storedRiddles = JSON.parse(localStorage.getItem("riddles") || "[]") || [];
                const updatedRiddles = [...storedRiddles, data];
                localStorage.setItem("riddles", JSON.stringify(updatedRiddles));
            }
        } catch (error) {
            alert("An error occurred. Please try again.");
        }

    };

    // ✅ Function to handle geocoding search
    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        try {
            const response = await fetch(`https://api.jawg.io/places/v1/search?text=${encodeURIComponent(searchQuery)}&access-token=${accessToken}`);
            const data = await response.json();

            if (data.features) {
                setSearchResults(data.features);
            }
        } catch (error) {
            console.error("Error fetching geocoding data:", error);
        }
    };

    return (
        <div className="relative w-full h-screen mt-[-3.75rem]">

            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white p-3 rounded shadow-md z-50 w-80">
                <Input
                    type="text"
                    placeholder="Search for a place..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button onClick={handleSearch} className="mt-2 w-full">
                    Search
                </Button>

                {searchResults.length > 0 && (
                    <div className="mt-2 bg-white border rounded shadow-lg max-h-48 overflow-y-auto">
                        {searchResults.map((result) => (
                            <div
                                key={result.properties.id}
                                className="p-2 hover:bg-gray-100 cursor-pointer"
                                onClick={() => {
                                    const [lng, lat] = result.geometry.coordinates;
                                    mapInstance.current.setView([lat, lng], 12);
                                    setSearchQuery("");
                                    setSearchResults([]);
                                }}
                            >
                                {result.properties.label}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="absolute top-4 left-[90%] transform -translate-x-1/2 bg-white p-3 rounded shadow-md z-50 w-60">
                <div className="font-semibold">Attempts Left: {localStorage.getItem('attemptsLeft')}</div>
                <div className="font-semibold">Status: {localStorage.getItem('gameStatus')}</div>
                <div className="font-semibold">Difficulty: {localStorage.getItem('difficulty')}</div>
            </div>


            <div id="map" className="w-full h-full z-[1]"></div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="z-[1050]">
                    <DialogHeader>
                        <DialogTitle>Congrats!!!</DialogTitle>
                        <DialogDescription>Go to the next riddle.</DialogDescription>
                    </DialogHeader>
                    <Button className="w-full mt-4" onClick={() => {
                        setIsDialogOpen(false);

                        window.dispatchEvent(new Event("storage"));
                    }}>
                        Next Riddle
                    </Button>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MapComponent;
