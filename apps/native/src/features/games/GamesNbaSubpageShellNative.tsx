/**
 * Web `GamesNbaSubpageShell` 相当。
 * アワード / 順位予想は Games と同じ UNITERZ 棚を残し、タイトルはワードマークへ。
 */
import type { ComponentProps } from "react";
import CyberSubpageShellNative from "../../ui/CyberSubpageShellNative";

export default function GamesNbaSubpageShellNative(
  props: ComponentProps<typeof CyberSubpageShellNative>
) {
  const titleInBrandShelf =
    props.title === "AWARDS" || props.title === "STANDINGS";
  return (
    <CyberSubpageShellNative
      {...props}
      hideBrandShelf={false}
      titleInBrandShelf={titleInBrandShelf}
    />
  );
}
