import WebGLMarketField from './WebGLMarketField';

const BackgroundVideo = () => {
    return (
        <>
            <div className="fixed inset-0 z-0 bg-[#070b0d]" />
            <video
                autoPlay
                loop
                muted
                playsInline
                className="fixed inset-0 z-0 h-full w-full object-cover opacity-45 saturate-[0.78] contrast-[1.06]"
            >
                <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260315_073750_51473149-4350-4920-ae24-c8214286f323.mp4" type="video/mp4" />
            </video>
            <div className="fixed inset-0 z-0 bg-[radial-gradient(circle_at_18%_20%,rgba(215,111,55,0.18),transparent_28rem),radial-gradient(circle_at_82%_42%,rgba(47,111,94,0.24),transparent_32rem),linear-gradient(180deg,rgba(7,11,13,0.1),rgba(7,11,13,0.86))]" />
            <WebGLMarketField />
        </>
    );
};

export default BackgroundVideo;
