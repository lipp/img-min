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
    width: Math.floor(width * 1.3),
    quality: Math.min(quality * 1.1, 100),
    format
  })} 2x, ${getImgScaleUrl({
    url,
    width: Math.floor(width * 1.5),
    quality: Math.min(quality * 1.3, 100),
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
      right: 0;
      bottom: 0;
      height: 100%;
      filter: blur(var(--preview-blur));
      transform: scale3d(1.03, 1.03, 1);
      transition: all 0.7s ease-in-out;
    }
    :host {
      display: block;
    }

    :host([preview]),
    :host([loaded]) {
      background: none;
    }

    :host([preview]) img {
      opacity: 1;
    }

    :host([loaded]) img {
      opacity: 1;
      filter: blur(0px);
      transform: scale3d(1, 1, 1);
    }
  </style>
`

let postponed = []
const pendingPreviews = {}
let isOnScrollInit

customElements.define(
  'img-min',
  class extends HTMLElement {
    constructor() {
      super()
      if (!isOnScrollInit) {
        isOnScrollInit = true
        document.addEventListener('scroll', onScroll)
      }

      invisibles.push(this)
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
        this.isPreview = false
        delete pendingPreviews[this.src]
        this.setAttribute('preview', '')
        postponed.push(() => this.resize())
        if (Object.keys(pendingPreviews).length === 0) {
          postponed.reverse().forEach(e => e())
          postponed = []
        }
        this.img.onload = onHighresLoaded
      }
      this.img.onload = onPreviewLoaded
      this.resize = this.resize.bind(this)
      addEventListener('resize', this.resize)
    }

    static get observedAttributes() {
      return ['src', 'quality']
    }

    get src() {
      return this.getAttribute('src')
    }

    get quality() {
      return this.getAttribute('quality') || 50
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
      console.log(this.quality)
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
      this.jpeg =
        this.jpeg || this.shadowRoot.querySelector('source[type="image/jpeg"]')
      this.jpeg.srcset = this.getSrcset('jpeg')
      this.webp =
        this.webp || this.shadowRoot.querySelector('source[type="image/webp"]')
      this.webp.srcset = this.getSrcset('webp')
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
      this.isPreview = true
      console.log('preiew')
      pendingPreviews[this.src] = true
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
      const { width, height } = this.img.getBoundingClientRect()
      this.img.style.setProperty(
        '--preview-blur',
        `${Math.floor(width / 20)}px`
      )
      console.log(this.quality, this.getAttribute('quality'))
      if (height === 0) {
        console.warn(
          'img-min: element has height=0 and will never be visible',
          this
        )
        console.warn(
          'img-min: it is recommend to use --aspect-ratio to all images'
        )
      }
      const aspect = this.getAttribute('a2spect')
      if (aspect) {
        this.img.style.height = '100%'
        this.img.style.objectFit = 'cover'
        this.picture.style.paddingTop = getPaddingTop(aspect)
      }
      setTimeout(() => {
        this.checkVisibility()
      }, 100)
    }
  }
)
