import Head from 'next/head';

export default function PrintLayout({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="p-6 max-w-3xl mx-auto print:p-0 print:max-w-none">
        {children}
      </div>
    </>
  );
}