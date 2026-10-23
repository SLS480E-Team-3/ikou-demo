import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Ikko!! demo',
        short_name: 'Ikko',
        description: 'Japanese-learning island game (demo)',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#a9cf7a',
        theme_color: '#a9cf7a',
        icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
    }
}
// served at /manifest.webmanifest (Next adds the <link rel="manifest">).
// display standalone = launched from the Home Screen it opens full screen,
// without Safari's URL bar. No start_url on purpose: it then defaults to
// the page it was added from, so adding it on /MobDev/GameScene opens that
// screen and adding it on / opens the game. background_color is the splash
// screen, the island's forest green like the icon (public/icons, made from
// img/nyanko.png scaled up with nearest-neighbor)
