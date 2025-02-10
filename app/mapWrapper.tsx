"use client";
import AuthGuard from "@/components/AuthGaurd";
import MapComponent from "./map";

const MapWrapper = () => {
    const accessToken = localStorage.getItem("accessToken") || 1;

    return (
        <AuthGuard>
            <MapComponent />
        </AuthGuard>
    )
};

export default MapWrapper;
