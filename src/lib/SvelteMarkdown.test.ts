import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/svelte'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import SvelteMarkdown from './SvelteMarkdown.svelte'

beforeEach(() => {
    vi.useFakeTimers()
})

describe('testing initialization', () => {
    test('accepts pre-processed tokens as source', async () => {
        const { container } = render(SvelteMarkdown, {
            props: {
                source: [
                    {
                        type: 'paragraph',
                        raw: 'this is an **example**',
                        text: 'this is an **example**',
                        tokens: [
                            { type: 'text', raw: 'this is an ', text: 'this is an ' },
                            {
                                type: 'strong',
                                raw: '**example**',
                                text: 'example',
                                tokens: [{ type: 'text', raw: 'example', text: 'example' }]
                            }
                        ]
                    }
                ]
            }
        })

        // Wait for all timers and effects to settle
        await vi.runAllTimersAsync()

        // Query the DOM directly to avoid state mutations
        const element = container.querySelector('strong')
        expect(element).toBeInTheDocument()
        expect(element?.textContent).toBe('example')
        expect(element?.nodeName).toBe('STRONG')
    })
})

describe('testing default renderers', () => {
    test('renders a paragraph', () => {
        render(SvelteMarkdown, { source: 'Plain text' })

        const element = screen.getByText('Plain text')
        expect(element).toBeInTheDocument()
        expect(element.nodeName).toBe('P')
    })

    test('renders emphasized paragraph', () => {
        render(SvelteMarkdown, { source: '*Plain text*' })

        const element = screen.getByText('Plain text')
        expect(element).toBeInTheDocument()
        expect(element.nodeName).toBe('EM')
    })

    test('renders strong paragraph', () => {
        render(SvelteMarkdown, { source: '**Plain text**' })

        const element = screen.getByText('Plain text')
        expect(element).toBeInTheDocument()
        expect(element.nodeName).toBe('STRONG')
    })

    test('renders a separator', () => {
        render(SvelteMarkdown, { source: '---' })

        expect(document.getElementsByTagName('hr')[0]).toBeInTheDocument()
    })

    test('renders a blockquote', () => {
        render(SvelteMarkdown, { source: '> Plain text' })
        const paragraphElement = screen.getByText('Plain text')
        const element = document.getElementsByTagName('blockquote')[0]
        expect(element).toBeInTheDocument()
        expect(element).toHaveTextContent('Plain text')
        expect(element.nodeName).toBe('BLOCKQUOTE')
        expect(element).toContainElement(paragraphElement)
        expect(paragraphElement.nodeName).toBe('P')
    })

    describe('renders a link', () => {
        test('renders link title', () => {
            render(SvelteMarkdown, {
                source: '[link](https://pablo.berganza.dev "link title")'
            })

            const element = screen.getByRole('link', { title: /link title/ })
            expect(element).toBeInTheDocument()
            expect(element).toHaveTextContent('link')
        })

        test('renders link name', () => {
            render(SvelteMarkdown, {
                source: '[link](https://pablo.berganza.dev "link title")'
            })

            const element = screen.getByRole('link', { name: /link/ })
            expect(element).toBeInTheDocument()
            expect(element).toHaveTextContent('link')
        })
    })

    describe('heading', () => {
        test('renders a heading with id', () => {
            render(SvelteMarkdown, { source: '# This is a title' })

            const element = screen.getByRole('heading', { name: /This is a title/ })
            expect(element).toBeInTheDocument()
            expect(element).toHaveAttribute('id', 'this-is-a-title')
        })

        test('renders a heading (alternative syntax)', () => {
            render(SvelteMarkdown, { source: 'This is a title\n===' })

            const element = screen.getByRole('heading', { name: /This is a title/ })
            expect(element).toBeInTheDocument()
            expect(element).toHaveAttribute('id', 'this-is-a-title')
        })

        test('renders a heading with id and prefix', async () => {
            const { container } = render(SvelteMarkdown, {
                props: {
                    source: '# This is a title',
                    options: {
                        headerPrefix: 'test-'
                    }
                }
            })

            const heading = container.querySelector('h1')
            expect(heading).toHaveAttribute('id', 'test-this-is-a-title')
        })

        test('renders a heading with non-duplicate id', () => {
            render(SvelteMarkdown, {
                source: '# This is a title\n\n## This is a title'
            })

            const element = screen.getAllByRole('heading', {
                name: /This is a title/
            })
            expect(element[0]).toHaveAttribute('id', 'this-is-a-title')
            expect(element[1]).toHaveAttribute('id', 'this-is-a-title-1')
        })

        test('renders a heading without id', () => {
            render(SvelteMarkdown, {
                source: '# This is a title',
                options: { headerIds: false }
            })

            const element = screen.getByRole('heading', { name: /This is a title/ })
            expect(element).not.toHaveAttribute('id')
        })
    })

    test('renders an image', () => {
        render(SvelteMarkdown, {
            source: '![Image](https://pablo.berganza.dev/img/profile-pic-400.jpeg "image title")'
        })

        const element = screen.getByRole('img', { name: /Image/ })
        expect(element).toBeInTheDocument()
        expect(element).toHaveAttribute('title', 'image title')
    })

    test('renders a table', () => {
        render(SvelteMarkdown, {
            source: `
  | header |
  |--------|
  | value |`
        })

        const element = screen.getByRole('table')
        const tableHeaderElement = screen.getByRole('columnheader', {
            name: /header/
        })
        const tableCellElement = screen.getByRole('cell', { name: /value/ })
        expect(element).toBeInTheDocument()
        expect(element).toContainElement(tableHeaderElement)
        expect(element).toContainElement(tableCellElement)
    })

    describe('html rendering', () => {
        test('short html renders properly', () => {
            render(SvelteMarkdown, { source: 'a<sub>1</sub>' })

            const element = screen.getByText('1')
            expect(element).toBeInTheDocument()
            expect(element.nodeName).toBe('SUB')

            const element2 = screen.getByText('a')
            expect(element2).toBeInTheDocument()
            expect(element2.nodeName).toBe('P')
        })

        test('renders nested html elements', () => {
            render(SvelteMarkdown, {
                source: '<div>Hello <span>nested <em>world</em></span></div>'
            })

            const emElement = screen.getByText('world')
            expect(emElement).toBeInTheDocument()
            expect(emElement.nodeName).toBe('EM')
            expect(emElement.parentElement?.nodeName).toBe('SPAN')
            expect(emElement.parentElement?.parentElement?.nodeName).toBe('DIV')
        })

        test('renders html with attributes', () => {
            render(SvelteMarkdown, {
                source: '<a href="https://example.com" class="link">Click me</a>'
            })

            const linkElement = screen.getByText('Click me')
            expect(linkElement).toBeInTheDocument()
            expect(linkElement.nodeName).toBe('A')
            expect(linkElement).toHaveAttribute('href', 'https://example.com')
            expect(linkElement).toHaveAttribute('class', 'link')
        })

        test('renders mixed markdown and html', () => {
            render(SvelteMarkdown, {
                source: '**Bold** text with <code>inline code</code> and *italic*'
            })

            expect(screen.getByText('Bold')).toHaveProperty('nodeName', 'STRONG')
            expect(screen.getByText('inline code')).toHaveProperty('nodeName', 'CODE')
            expect(screen.getByText('italic')).toHaveProperty('nodeName', 'EM')
        })
    })
})
