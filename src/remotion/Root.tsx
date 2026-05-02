import { Composition } from 'remotion';
import { TokenBackground } from './TokenBackground';

export const RemotionRoot = () => {
  return (
    <Composition
      id="BloomXHero"
      component={TokenBackground}
      durationInFrames={360}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
