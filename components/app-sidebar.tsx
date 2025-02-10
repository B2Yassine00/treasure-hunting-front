"use client";
import { Home, MapPinned, LogOut, XCircle } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button"; // ShadCN Button
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from "./ui/dialog";

const items = [
    {
        title: "Home",
        url: "/",
        icon: Home,
    },
    {
        title: "Enigmes",
        url: "/map",
        icon: MapPinned,
    },
];

export function AppSidebar() {

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentRiddle, setCurrentRiddle] = useState(1);
    const [riddles, setRiddles] = useState([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [hasActiveGame, setHasActiveGame] = useState(false);

    // Function to load riddles from localStorage
    const loadRiddles = () => {
        if (typeof window !== "undefined") {
            const storedRiddles = JSON.parse(localStorage.getItem("riddles") || "[]");
            setRiddles(storedRiddles);

            // Check if the user is logged in
            setIsLoggedIn(!!localStorage.getItem("username"));

            // Check if there is an active game session
            setHasActiveGame(!!localStorage.getItem("gameId") && !!localStorage.getItem("accessToken"));
        }
    };

    // Load riddles initially when component mounts
    useEffect(() => {
        loadRiddles();

        // Listen for changes in localStorage
        const handleStorageChange = () => {
            loadRiddles();
        };

        window.addEventListener("storage", handleStorageChange);

        return () => {
            window.removeEventListener("storage", handleStorageChange);
        };
    }, []);

    const handleLogout = async () => {
        const gameId = localStorage.getItem("gameId");
        try {
            const response = await fetch(`${apiUrl}/game/${gameId}/abandon`, {
                method: "POST",
            });
            const data = await response.json();

            if (response.ok) {
                console.log(data.message);
            } else {
                console.log("Échec de l'abandon de la partie.");
            }
        } catch (error) {
            console.error("Erreur lors de l'abandon de la partie :", error);
            alert("Une erreur est survenue.");
        }
        localStorage.clear();
        window.location.reload();
    };

    const handleAbandonGame = async () => {
        const gameId = localStorage.getItem("gameId");
        const accessToken = localStorage.getItem("accessToken");

        if (!gameId || !accessToken) return;

        try {
            const response = await fetch(`${apiUrl}/game/${gameId}/abandon`, {
                method: "POST",
            });
            const data = await response.json();
            console.log("Game abandoned:", data);
            if (response.ok) {
                localStorage.removeItem("currentRiddle");
                localStorage.removeItem("riddles");
                localStorage.removeItem("answers");
                localStorage.removeItem("gameId");
                localStorage.removeItem("accessToken");
                localStorage.removeItem("attemptsLeft");
                localStorage.removeItem("gameStatus");
                localStorage.removeItem("difficulty");

                alert(data.message);
                window.location.reload();
            } else {
                alert("Échec de l'abandon de la partie.");
            }
        } catch (error) {
            console.error("Erreur lors de l'abandon de la partie :", error);
            alert("Une erreur est survenue.");
        }
    };

    return (
        <>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="z-[1050]">
                    <DialogHeader>
                        <DialogTitle>Riddle Number {currentRiddle}</DialogTitle>
                        <DialogDescription>
                            {riddles.length >= currentRiddle ? riddles[currentRiddle - 1]?.question : "No riddle available"}
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>

            <Sidebar>
                <SidebarHeader>
                    <div className="flex items-center justify-center p-2">
                        <h3 className="font-semibold">Treasure Hunting</h3>
                    </div>
                </SidebarHeader>

                <SidebarContent>
                    <SidebarMenu>
                        <SidebarGroup>
                            <SidebarGroupContent style={{ paddingLeft: "1rem", color: "hsl(var(--sidebar-foreground) / 0.7)" }}>
                                <SidebarMenuItem key={items[0].title}>
                                    <SidebarMenuButton asChild>
                                        <a href={items[0].url}>
                                            {React.createElement(items[0].icon)}
                                            <span>{items[0].title}</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarGroupContent>
                        </SidebarGroup>

                        <SidebarGroup>
                            <SidebarGroupLabel style={{ padding: "1rem" }}>
                                <SidebarMenuButton asChild>
                                    <a href={items[1].url}>
                                        {React.createElement(items[1].icon)}
                                        <span>{items[1].title}</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarGroupLabel>

                            <SidebarGroupContent style={{ paddingLeft: "1.5rem" }}>
                                {riddles.map((riddle, index) => (
                                    <SidebarMenuItem key={index} style={{ padding: "0.25rem 0.5rem" }}>
                                        <SidebarMenuButton asChild style={{ padding: "0" }} onClick={() => {
                                            setIsDialogOpen(true);
                                            setCurrentRiddle(index + 1);
                                        }}>
                                            <span>Riddle {index + 1}</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </SidebarMenu>


                    <div className="absolute bottom-4 w-full px-4 flex flex-col gap-2">
                        {hasActiveGame && (
                            <Button onClick={handleAbandonGame} className="w-full flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600">
                                <XCircle size={18} />
                                Abandonner la partie
                            </Button>
                        )}
                        {isLoggedIn && (
                            <Button onClick={handleLogout} className="w-full flex items-center gap-2 bg-red-500 hover:bg-red-600">
                                <LogOut size={18} />
                                Déconnexion
                            </Button>
                        )}
                    </div>
                </SidebarContent>
            </Sidebar>
        </>
    );
}
