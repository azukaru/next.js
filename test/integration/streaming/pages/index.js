import Head from 'next/head'

export default function Index({ name }) {
  return (
    <>
      <Head>
        <title>Streaming</title>
      </Head>
      <span>{name ? `Hello ${name}` : `Loading...`}</span>
    </>
  )
}

export async function getServerSideProps({ req }) {
  await delay(5 * 1000)
  return {
    props: {
      name: 'World',
    },
  }
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
