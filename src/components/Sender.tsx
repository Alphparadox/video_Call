import { useEffect, useState, useRef } from "react";

export function Sender() {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);

    useEffect(() => {
        const newSocket = new WebSocket("ws://localhost:8080");

        newSocket.onopen = () => {
            newSocket.send(JSON.stringify({ type: "sender" }));
        };

        newSocket.onmessage = async (event) => {
            const message = JSON.parse(event.data);
            if (message.type === "createAnswer" && pcRef.current) {
                await pcRef.current.setRemoteDescription(message.sdp);
                console.log("Answer received and set as remote description.");
            }
        };

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, []);

    async function video() {
        const pc = new RTCPeerConnection();
        pcRef.current = pc;

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket?.send(JSON.stringify({
            type: "createOffer",
            sdp: pc.localDescription
        }));
    }

    return (
        <div>
            <h1>Sender Component</h1>
            <p>This is the sender component.</p>
            <button onClick={video}>send video</button>
        </div>
    );
}
