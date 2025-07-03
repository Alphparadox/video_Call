import { useEffect, useRef, useState } from 'react';

export function Receiver() {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);

    useEffect(() => {
        const newSocket = new WebSocket("ws://localhost:8080");

        newSocket.onopen = () => {
            newSocket.send(JSON.stringify({ type: "receiver" }));
        };

        newSocket.onmessage = async (event) => {
            const message = JSON.parse(event.data);

            if (message.type === "createOffer") {
                const pc = new RTCPeerConnection();
                pcRef.current = pc;

                await pc.setRemoteDescription(message.sdp);
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                newSocket.send(JSON.stringify({
                    type: "createAnswer",
                    sdp: pc.localDescription
                }));
            }
        };

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, []);

    return (
        <div>
            <h1>Receiver Component</h1>
            <p>This is the receiver component.</p>
        </div>
    );
}
