import { useState, useEffect } from 'react'

export default function Component() {
  const [env, setEnv] = useState('Server')
  useEffect(() => {
    setEnv('Client')
  }, [])
  return env
}
