export default function Index() {
  return <span>Foo</span>
}

export async function getServerSideProps(ctx) {
  return {
    props: {},
  }
}
