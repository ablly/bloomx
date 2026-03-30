// BackgroundVideo

const BackgroundVideo = () => {
    return (
        <video
            autoPlay
            loop
            muted
            playsInline
            className="fixed inset-0 w-full h-full object-cover z-0"
        >
            <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260315_073750_51473149-4350-4920-ae24-c8214286f323.mp4" type="video/mp4" />
            {/* Fallback pattern or color if video fails to load, handled by global styles */}
        </video>
    );
};

export default BackgroundVideo;
