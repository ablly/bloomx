import { Composition } from 'remotion';
import { WorkerLoop } from './WorkerLoop';

export const RemotionRoot = () => {
  return (
    <Composition
      id="BloomXHero"
      component={WorkerLoop}
      durationInFrames={360}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
