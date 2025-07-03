import { useEffect, useRef, useState } from 'react';

export function Receiver() {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        const newSocket = new WebSocket("ws://localhost:8080");

        newSocket.onopen = () => {
            console.log("✅ WebSocket connection established.");
            newSocket.send(JSON.stringify({ type: "receiver" }));
        };

        newSocket.onmessage = async (event) => {
            const message = JSON.parse(event.data);

            if (message.type === "createOffer") {
                const pc = new RTCPeerConnection();
                pcRef.current = pc;

                pc.onicecandidate = (event) => {
                    if (event.candidate) {
                        newSocket.send(JSON.stringify({
                            type: "iceCandidate",
                            candidate: event.candidate
                        }));
                    }
                };

                pc.ontrack = (event) => {
                    console.log("📺 Track received!");
                    if (videoRef.current) {
                        videoRef.current.srcObject = event.streams[0];
                    }
                };

                await pc.setRemoteDescription(message.sdp);
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                newSocket.send(JSON.stringify({
                    type: "createAnswer",
                    sdp: pc.localDescription
                }));
            }

            if (message.type === "iceCandidate" && pcRef.current) {
                try {
                    await pcRef.current.addIceCandidate(message.candidate);
                } catch (err) {
                    console.error("❌ Failed to add ICE candidate:", err);
                }
            }
        };

        setSocket(newSocket);

        return () => {
            newSocket.close();
            pcRef.current?.close();
        };
    }, []);

    return (
        <div>
            <h1>Receiver Component</h1>
            <video ref={videoRef} autoPlay playsInline style={{ width: "500px", border: "1px solid gray" }} />
        </div>
    );
}
