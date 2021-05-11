import React from 'react'

export default function FOUCHelper({ inAmpMode }: { inAmpMode: boolean }) {
  return (
    <>
      <style
        data-next-hide-fouc
        data-ampdevmode={inAmpMode ? 'true' : undefined}
        dangerouslySetInnerHTML={{
          __html: `body{display:none}`,
        }}
      />
      <noscript
        data-next-hide-fouc
        data-ampdevmode={inAmpMode ? 'true' : undefined}
      >
        <style
          dangerouslySetInnerHTML={{
            __html: `body{display:block}`,
          }}
        />
      </noscript>
    </>
  )
}
