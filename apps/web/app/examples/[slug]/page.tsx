import Link from "next/link";
import { Examples } from "../../../examples";
import { ExampleFrame } from "./example-frame";
import styles from "./styles.module.scss";
import { CodeButton } from "./code-button";
import { CodeOverlay } from "./code-overlay";

export default function Page(props: { params: { slug: string } }): JSX.Element {
  const exampleData = Examples.find(
    (example) => example.url === props.params.slug,
  );

  if (!exampleData) {
    throw new Error(`No example found for slug: ${props.params.slug}`);
  }

  return (
    <main className={styles.main}>
      <div className={styles.info}>
        <Link className={styles.back} href="/examples">
          back to examples
        </Link>

        <h1>{exampleData.title}</h1>
        <p>{exampleData.description}</p>

        <CodeButton />
      </div>

      <div className={styles.content}>
        <CodeOverlay sources={exampleData.code} />
        <ExampleFrame title={props.params.slug} />
      </div>
    </main>
  );
}

export function generateStaticParams(): { slug: string }[] {
  return Examples.map((example) => ({ slug: example.url }));
}
