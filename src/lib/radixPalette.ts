import { amberDark, bronzeDark, mintDark, slateDark } from '@radix-ui/colors';

export const bloomxRadix = {
  canvas: slateDark.slate1,
  canvasRaised: slateDark.slate2,
  surface: slateDark.slate3,
  surfaceLine: slateDark.slate6,
  text: slateDark.slate12,
  textMuted: slateDark.slate10,
  mintSoft: mintDark.mint3,
  mintLine: mintDark.mint7,
  mint: mintDark.mint9,
  mintStrong: mintDark.mint11,
  coinSoft: amberDark.amber3,
  coin: amberDark.amber9,
  coinStrong: amberDark.amber11,
  bronzeSoft: bronzeDark.bronze3,
  bronzeLine: bronzeDark.bronze7,
  bronze: bronzeDark.bronze9,
  bronzeStrong: bronzeDark.bronze11,
};

export type BloomxRadix = typeof bloomxRadix;
