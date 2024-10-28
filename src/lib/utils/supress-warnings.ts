import { onMount } from 'svelte'

export const supressWarnings = () => {
    const origWarn = console.warn

    console.warn = (message) => {
        if (message.includes('unknown prop')) return
        if (message.includes('unexpected slot')) return
        origWarn(message)
    }

    onMount(() => {
        console.warn = origWarn
    })
}
