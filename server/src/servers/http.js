import express from "express";

export function httpServer(port) {
    const app = express();
    app.use(express.json());
    app.use(express.static("../client/dist"));
    app.use('/public', express.static("public"));
    
    app.post("/api/token", async (req, res) => {
        try {
            const response = await fetch(`https://discord.com/api/oauth2/token`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    client_id: process.env.VITE_DISCORD_CLIENT_ID,
                    client_secret: process.env.DISCORD_CLIENT_SECRET,
                    grant_type: "authorization_code",
                    code: req.body.code,
                }),
            });
            if (response.status !== 200) {
                const message = await response.json();
                throw new Error(`Failed to get token: ${response.status} ${response.statusText} ${JSON.stringify(message)}`);
            }
            const {access_token} = await response.json();
            console.log("access_token", access_token);
            res.send({access_token});
        } catch (e) {
            console.error(JSON.stringify(e));
            res.status(500).send("Internal server error)");
        }
    });

    return app;
}