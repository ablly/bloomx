import { Composition } from 'remotion';
import { WorkerLoop } from './WorkerLoop';

export const RemotionRoot = () => {
  return (
    <Composition
      id="BloomXHero"
      component={WorkerLoop}
      durationInFrames={270}
      fps={30}
      width={1280}
      height={720}
    />
  );
};
