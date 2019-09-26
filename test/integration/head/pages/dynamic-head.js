function Dynamic () {
  return <div />
}

Dynamic.getInitialProps = () => {
  return { title: 'Dynamic Title' }
}

export default Dynamic

export const head = ({ title }) => (
  <>
    <title>{title}</title>
  </>
)
