/*
 * Next.js 16 ships a React canary in which <ViewTransition> is exported under its
 * final name, but @types/react 19.1 only knows it as `unstable_ViewTransition` in
 * the experimental typings. This bridges the two until the types catch up.
 */
/// <reference types="react/experimental" />
import "react";

declare module "react" {
  export const ViewTransition: typeof unstable_ViewTransition;
}
