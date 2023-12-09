import Link from "next/link";
import { ButtonGroup, Button } from "ui/button";
import { Scene } from "../scene";
import styles from "./styles.module.scss";
import { Screen } from "./screen";

export default function Page(): JSX.Element {
  return (
    <>
      <Scene id={styles.scene} />
      <Screen />

      <main className={styles.hero}>
        <h1>The power of modern web graphics. In the palm of your hand.</h1>

        <p>
          WGPU-Kit is a collection of libraries that make it easy to build
          high-performance, cross-platform, web-based graphics applications.
        </p>

        <ButtonGroup className={styles.buttons} style={{ marginTop: "2rem" }}>
          <a
            href="https://jmberesford.github.io/wgpu-kit/"
            rel="noopener"
            target="_blank"
          >
            <Button primary>Explore WGPU-Kit</Button>
          </a>

          <Link className={styles.button} href="/examples">
            <Button>View the Examples</Button>
          </Link>
        </ButtonGroup>
      </main>

      <section className={styles.why}>
        <div>
          <h2>Why Choose WGPU-Kit?</h2>

          <p>
            WGPU-Kit is built on the foundation of WebGPU, the next generation
            of web graphics. This low-level graphics API harnesses the power of
            modern GPU hardware, enabling visually rich and interactive
            applications that push the boundaries of what&apos;s possible in a
            browser. With WGPU-Kit, you get the combined power of WebGPU&apos;s
            future-proof technology and a library designed to make it easy to
            leverage that power.
          </p>
        </div>

        <aside>
          <h4>Homework Time!</h4>

          <ul>
            <li>
              <a
                href="https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API"
                rel="noopener"
                target="_blank"
              >
                What&apos;s a... WebGPU?
              </a>
            </li>
            <li>
              <a
                href="https://developer.chrome.com/blog/from-webgl-to-webgpu"
                rel="noopener"
                target="_blank"
              >
                From WebGL to WebGPU
              </a>
            </li>
          </ul>

          <h4>Extra Credit</h4>

          <ul>
            <li>
              <a
                href="https://www.w3.org/TR/webgpu/"
                rel="noopener"
                target="_blank"
              >
                The WebGPU spec
              </a>
            </li>

            <li>
              <a
                href="https://www.w3.org/TR/WGSL/"
                rel="noopener"
                target="_blank"
              >
                The WGSL spec
              </a>
            </li>
          </ul>
        </aside>
      </section>
    </>
  );
}
