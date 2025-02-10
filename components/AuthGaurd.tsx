"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ReactNode } from "react";

const AuthGuard = ({ children }: { children: ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("accessToken");

        if (!token) {
            router.push("/"); // Redirect to home if no token
        } else {
            setIsAuthenticated(true);
        }
    }, [router]);

    if (!isAuthenticated) {
        return null; // Prevents rendering until check is complete
    }

    return <>{children}</>;
};

export default AuthGuard;
