/**
 * Ambient glow orbs — sit behind all content, in both themes.
 * This is what glass cards actually blur; without it there's nothing
 * colorful behind the frosted panels and they look like plain boxes.
 * Render once near the root, alongside <StarField /> and <CustomCursor />.
 */
export default function GlowOrbs() {
  return (
    <>
      <div className="glow-orb glow-orb--1" aria-hidden="true" />
      <div className="glow-orb glow-orb--2" aria-hidden="true" />
      <div className="glow-orb glow-orb--3" aria-hidden="true" />
    </>
  );
}
