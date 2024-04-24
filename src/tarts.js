export { tarts, generateTarBlob }

const headers = {
  name: 100,
  mode: 8,
  uid: 8,
  gid: 8,
  size: 12,
  mtime: 12,
  chksum: 8,
  typeflag: 1,
  linkname: 100,
  magic: 5,
  version: 2,
  uname: 32,
  gname: 32,
  devmajor: 8,
  devminor: 8,
  prefix: 155,
  padding: 12
}

const offsets = {}
Object.keys(headers).reduce((acc, k) => {
  offsets[k] = acc
  return acc + headers[k]
}, 0)

const defaults = (f) => ({
  name: f.name,
  mode: '777',
  uid: 0,
  gid: 0,
  size: f.content.byteLength,
  mtime: Math.floor(Number(new Date()) / 1000),
  chksum: '        ',
  typeflag: '0',
  magic: 'ustar',
  version: '  ',
  uname: '',
  gname: ''
})

const nopad = ['name', 'linkname', 'magic', 'chksum', 'typeflag', 'version', 'uname', 'gname']
const bsize = 512

function tarts(files) {
  return files.reduce((a, f) => {
    if (typeof f.content === 'string') f.content = stringToUint8(f.content)
    f = Object.assign(defaults(f), f)
    const b = new Uint8Array(Math.ceil((bsize + f.size) / bsize) * bsize)
    const checksum = Object.keys(headers).reduce((acc, k) => {
      if (!(k in f)) return acc
      const value = stringToUint8(nopad.indexOf(k) > -1 ? f[k] : pad(f[k], headers[k] - 1))
      b.set(value, offsets[k])
      return acc + value.reduce((a, b) => a + b, 0)
    }, 0)
    b.set(stringToUint8(pad(checksum, 7)), offsets.chksum)
    b.set(f.content, bsize)
    const sum = new Uint8Array(a.byteLength + b.byteLength)
    sum.set(a, 0)
    sum.set(b, a.byteLength)
    return sum
  }, new Uint8Array(0))
}

function pad(s, n) {
  s = s.toString(8)
  return ('000000000000' + s).slice(s.length + 12 - n)
}

function stringToUint8(s) {
  const a = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i)
  return a
}

const readFile = (files, fileName) => {
  return new Promise((resolve, reject) => {
    let found = false
    for (const file of files) {
      if (file.name === fileName) {
        found = true
        const reader = new FileReader()
        reader.onload = function (event) {
          resolve(new TextDecoder().decode(new Uint8Array(event.target.result)))
        }
        reader.onerror = function (event) {
          reject(event.target.error)
        }
        reader.readAsArrayBuffer(file)
      }
    }
    if (!found) reject('Gitignore file not found')
  })
}

const readGitignoreContent = async (files) => {
  const content = await readFile(files, '.gitignore')
  let filters = content.split('\n')
    .map(line => line.trim())
    .map(line => line.charAt(0) === '/' ? line.substring(1) : line)
    .map(line => line.length > 0 && line.charAt(0) !== '#' ? line : null)
    .filter(line => line !== null)
  // reverse the order of the filters
  filters.reverse()
  filters.push('.git/')
  filters.push('.git')
  return filters
}

function shouldExclude(filters, fileName) {
  // Iterate through each filter
  for (let i = 0; i < filters.length; i++) {
    const filter = filters[i];
    // Check if the filter is a negation filter
    if (filter.startsWith('!')) {
      // If it is, remove the negation character and check if the file matches
      if (fileName.match(filter.substring(1))) {
        return false; // Exclude negated file
      }
    } else {
      // If it's not a negation filter, check if the file matches
      // Special case for patterns like 'folder_a/**'
      if (filter.endsWith('/**')) {
        const folderPattern = filter.substring(0, filter.length - 3); // Remove '/**'
        if (fileName.startsWith(folderPattern)) {
          return true; // Exclude file matching folder pattern
        }
      } else if (fileName.match(filter)) {
        return true; // Exclude file
      }
    }
  }

  return false; // Include file by default
}



// Helper functions
const generateTarBlob = (files) => {
  return new Promise(async (resolve, reject) => {
    const gitIgnores = await readGitignoreContent(files);
    const tarFiles = []
    if (!files.length) reject('No files found')

    try {
      let ignoredFilesSet = new Set()
      let paths = []
      for (const file of files) {
        const reader = new FileReader()

        reader.onload = function (event) {
          const contentArrayBuffer = event.target.result
          const contentUint8Array = new Uint8Array(contentArrayBuffer)
          const relativePath = file.webkitRelativePath.replace(/^.*?\//, '')
          if (!shouldExclude(gitIgnores, relativePath)) {
            tarFiles.push({
              name: relativePath,
              content: contentUint8Array
            })
            paths.push(relativePath) // TODO : remove this
          } else {
            ignoredFilesSet.add(relativePath)
          }

          if ((tarFiles.length + ignoredFilesSet.size) === files.length) {
            console.log(paths)
            // eslint-disable-next-line no-undef
            const tarball = tarts(tarFiles)
            resolve(
              new Blob([tarball], {
                type: 'application/x-tar'
              })
            )
          }
        }
        reader.readAsArrayBuffer(file)
      }
    } catch (error) {
      reject(error)
    }
  })
}