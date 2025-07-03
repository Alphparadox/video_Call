import { useEffect, useState, useRef } from "react";

export function Sender() {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        const newSocket = new WebSocket("ws://localhost:8080");

        newSocket.onopen = () => {
            newSocket.send(JSON.stringify({ type: "sender" }));
        };

        newSocket.onmessage = async (event) => {
            const message = JSON.parse(event.data);

            if (message.type === "createAnswer" && pcRef.current) {
                await pcRef.current.setRemoteDescription(message.sdp);
                console.log("✅ Answer set on sender.");
            }

            if (message.type === "iceCandidate" && pcRef.current) {
                try {
                    await pcRef.current.addIceCandidate(message.candidate);
                } catch (err) {
                    console.error("❌ ICE error on sender:", err);
                }
            }
        };

        setSocket(newSocket);
        return () => {
            newSocket.close();
            pcRef.current?.close();
        };
    }, []);

    async function startStream() {
        const pc = new RTCPeerConnection();
        pcRef.current = pc;

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        if (videoRef.current) {
            videoRef.current.srcObject = stream;
        }

        pc.onnegotiationneeded = async () => {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            socket?.send(JSON.stringify({
                type: "createOffer",
                sdp: pc.localDescription
            }));
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket?.send(JSON.stringify({
                    type: "iceCandidate",
                    candidate: event.candidate
                }));
            }
        };
    }

    return (
        <div>
            <h1>Sender Component</h1>
            <video ref={videoRef} autoPlay muted playsInline style={{ width: "500px", border: "1px solid gray" }} />
            <button onClick={startStream}>Start Stream</button>
        </div>
    );
}
