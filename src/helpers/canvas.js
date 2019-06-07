/**
 * Conserve aspect ratio of the orignal region. Useful when shrinking/enlarging
 * images to fit into a certain area.
 *
 * @param {Number} srcWidth width of source image
 * @param {Number} srcHeight height of source image
 * @param {Number} maxWidth maximum available width
 * @param {Number} maxHeight maximum available height
 * @return {Object} { width, height }
 */
export const calculateAspectRatioFit = (srcWidth, srcHeight, maxWidth, maxHeight) => {
    return Math.floor(Math.min(maxWidth / srcWidth, maxHeight / srcHeight) * 1000) / 1000
}
