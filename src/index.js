const html = String.raw

const getImgScaleUrl = ({ url, width, quality, format }) =>
  `https://img-scale.now.sh?format=${format}&width=${width}&quality=${quality}&url=${encodeURIComponent(
    url
  )}`

const getUrl = ({ format, url, width, quality, isPreview }) => {
  if (0) {
    return window.imgMin.getSrcset({ url, width, quality, isPreview, format })
  }
  if (isPreview) {
    width = width / 7
    // quality = 10
  }

  width = Math.floor(width)
  width = width > 50 ? width - (width % 30) : width - (width % 5)
  return `${getImgScaleUrl({
    url,
    width,
    quality,
    format
  })} 1x,${getImgScaleUrl({
    url,
    width: Math.floor(width * 1.1),
    quality: Math.min(Math.floor(quality * 1.1), 100),
    format
  })} 2x, ${getImgScaleUrl({
    url,
    width: Math.floor(width * 1.3),
    quality: Math.min(Math.floor(quality * 1.3), 100),
    format
  })} 3x`
}
let invisibles = []

let active
const onScroll = () => {
  if (!active && invisibles.length > 0) {
    active = true
    setTimeout(() => {
      invisibles.forEach(e => e.checkVisibility())
      invisibles = invisibles.filter(e => !e.visible)
      active = false
    }, 200)
  }
}
const template = html`
  <picture>
    <source type="image/webp" />
    <source type="image/jpeg" />
    <img part="img" />
  </picture>
  <style>
    picture,
    img {
      display: block;
      width: 100%;
    }

    picture {
      overflow: hidden;
      position: relative;
      padding-bottom: calc(100% / (var(--aspect-ratio)));
    }
    img {
      position: absolute;
      opacity: 0;
      top: 0;
      left: 0;
      height: 100%;
      filter: blur(var(--preview-blur));
      transform: scale3d(1.1, 1.1, 1);
      transition: all 0.7s ease-in-out;
    }
    :host {
      display: block;
      background: #f4f4f4;
    }

    :host([loaded]) {
    }

    :host([preview]) img {
      opacity: 1;
    }

    :host([loaded]) img {
      opacity: 1;
      filter: blur(0px);
      transform: translateZ(0) scale3d(1, 1, 1);
    }
  </style>
`

let postponed = []
const pending = {}
let initOnce
let isWebpSupported

const init = async () => {
  document.addEventListener('scroll', onScroll)
  isWebpSupported = await testIsWebpSupported()
}

// from here: https://ourcodeworld.com/articles/read/630/how-to-detect-if-the-webp-image-format-is-supported-in-the-browser-with-javascript
const testIsWebpSupported = async () => {
  if (!createImageBitmap) {
    return false
  }

  // Base64 representation of a white point image
  const webpData =
    'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoCAAEAAQAcJaQAA3AA/v3AgAA='

  // Retrieve the Image in Blob Format
  const blob = await fetch(webpData).then(r => r.blob())

  // If the createImageBitmap method succeeds, return true, otherwise false
  return createImageBitmap(blob).then(() => true, () => false)
}

customElements.define(
  'img-min',
  class extends HTMLElement {
    constructor() {
      super()
      if (!initOnce) {
        initOnce = true
        init()
      }

      this.maxWidth = 0
      const shadowRoot = this.attachShadow({
        mode: 'open'
      })
      shadowRoot.innerHTML = template

      this.picture = shadowRoot.querySelector('picture')
      this.img = this.shadowRoot.querySelector('img')

      const onHighresLoaded = () => {
        this.removeAttribute('preview')
        this.setAttribute('loaded', '')
        this.img.onload = null
      }
      const onPreviewLoaded = () => {
        delete pending[this.src]
        this.setAttribute('preview', '')
        if (this.isFirefox) {
          this.removeAttribute('preview')
          this.setAttribute('loaded', '')
          this.img.onload = null
          return
        }
        this.isPreview = false
        this.img.onload = onHighresLoaded
        postponed.push(() => this.resize())
        if (Object.keys(pending).length === 0) {
          postponed.reverse().forEach(e => e())
          postponed = []
        }
      }
      this.img.onload = onPreviewLoaded
      this.resize = this.resize.bind(this)
      addEventListener('resize', this.resize)
      invisibles.push(this)
    }

    static get observedAttributes() {
      return ['src', 'quality']
    }

    get src() {
      return this.getAttribute('src')
    }

    get quality() {
      return parseInt(this.getAttribute('quality'), 10) || 50
    }

    set quality(quality) {
      this.setAttribute('quality', quality)
      this.updateSrcset()
    }

    set src(url) {
      this.setAttribute('src', url)
      this.updateSrcset()
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue) return
      this[name] = newValue
    }

    getSrcset(format) {
      return getUrl({
        url: this.src,
        format,
        width: this.width,
        height: this.height,
        quality: this.quality,
        isPreview: this.isPreview
      })
    }

    updateSrcset() {
      if (!this.visible) {
        return
      }
      // Safari loads the same image once for each
      // <source>.srcset attribute in <picture> even
      // if the format (webp) is not supported.
      // Thus the check is required!
      if (isWebpSupported) {
        this.webp =
          this.webp ||
          this.shadowRoot.querySelector('source[type="image/webp"]')
        this.webp.srcset = this.getSrcset('webp')
      } else {
        this.jpeg =
          this.jpeg ||
          this.shadowRoot.querySelector('source[type="image/jpeg"]')
        this.jpeg.srcset = this.getSrcset('jpeg')
      }
    }

    get width() {
      return this._width
    }

    set width(width) {
      this._width = width
      this.updateSrcset()
    }

    disconnectedCallback() {
      removeEventListener('resize', this.resize)
    }

    loadPreview(width) {
      this.isPreview = this.isFirefox ? false : true
      pending[this.src] = true
      this.width = width
    }

    checkVisibility() {
      const dist = parseInt(this.getAttribute('lazy-dist')) || 100
      const { top, bottom, width, height } = this.img.getBoundingClientRect()
      const isAbove = bottom < -dist
      const isBelow = top > window.innerHeight + dist
      if (!isAbove && !isBelow && !this.visible) {
        this.visible = true
        this.height = height
        this.loadPreview(width)
      }
    }
    resize() {
      if (!this.visible) {
        return
      }
      cancelAnimationFrame(this.af)
      this.af = requestAnimationFrame(() => {
        const { width, height } = this.img.getBoundingClientRect()
        if (width > this.maxWidth) {
          this.maxWidth = width
          this.height = height
          this.width = width
        }
      })
    }
    connectedCallback() {
      this.isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1
      if (this.isFirefox) {
        this.img.style.setProperty('transition-property', 'opacity')
      }
      const { width, height } = this.img.getBoundingClientRect()
      this.img.style.setProperty(
        '--preview-blur',
        `${Math.floor(width / 18)}px`
      )
      if (height === 0) {
        console.warn(
          'img-min: element has height=0 and will never be visible',
          this
        )
        console.warn(
          'img-min: it is recommend to use --aspect-ratio to all images'
        )
      }
      setTimeout(() => {
        this.checkVisibility()
      }, 50)
    }
  }
)
