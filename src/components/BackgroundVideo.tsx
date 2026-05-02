const BackgroundVideo = () => {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#f4f1ea]" aria-hidden="true">
      <video
        className="absolute inset-0 h-full w-full object-cover opacity-100"
        src="/media/bloomx-worker-loop.mp4"
        poster="/media/bloomx-generated-hero.png"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,8,7,0.76),rgba(5,8,7,0.38)_42%,rgba(5,8,7,0.1)_78%,rgba(5,8,7,0.02)),linear-gradient(180deg,rgba(5,8,7,0.12),rgba(5,8,7,0.34)_78%,rgba(5,8,7,0.72))]" />
      <div className="absolute inset-0 opacity-[0.16] [background-image:radial-gradient(rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:3px_3px]" />
    </div>
  );
};

export default BackgroundVideo;
