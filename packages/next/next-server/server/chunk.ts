export default function chunk(query: any, render: any) {
  return (...args: any) => {
    return (props: any) => {
      return query.apply(null, args)
    }
  }
}
