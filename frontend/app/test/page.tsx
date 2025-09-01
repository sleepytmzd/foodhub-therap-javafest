"use client";

import createApi from "@/lib/api";
import api from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider"
import { useState } from "react";

export default function Home(){
    const [data, setData] = useState<string | null>(null);
    const {initialized, keycloak} = useAuth();
    const api = createApi(process.env.NEXT_PUBLIC_VISIT_SERVICE_URL)

    if (!keycloak?.authenticated) {
        return <p>You must log in to see protected data.</p>;
    }
    console.log(keycloak.tokenParsed);

    
    const loadData = async () => {
        try {
            const res = await api.get("/api/visit");
            setData(JSON.stringify(res.data));
        } catch (err) {
            console.error("API request failed", err);
        }
    };

    return (
        <div>
            <button onClick={loadData}>Load Protected Data</button>
            {data && <pre>{data}</pre>}
        </div>
    );
}