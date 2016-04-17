const db = require('./src/services/relationship').db
const uniq = require('lodash.uniq') 
const filter = require('lodash.filter')
const reduce = require('lodash.reduce')
const map = require('lodash.map')
const sort = require('lodash.sortby')
const each = require('lodash.foreach')
const Graph = require('ngraph.graph')
const centrality = require('ngraph.centrality')
//db.get({ predicate: 'follows' }, (err, list) => {
 // console.log(list.length)

 // const followers = map(list, t => t.subject)
  //console.log(uniq(followers))
  

//})
const g = Graph()
const firstMap = {}
const inMap = {}
const ego = 47789220
const start = Date.now()


 const stream = db.searchStream([
     { subject: ego, predicate: 'follows', object: db.v('first') },
     { subject: db.v('first'), predicate: 'follows', object: db.v('second') }
   ])
 
 stream.on('data', d => {
   if (!inMap[d.first]) {
     inMap[d.first] = 1
     //g.addLink(ego, d.first)
   }
 
   if (!inMap[d.second]) {
     inMap[d.second] = 1
   } else {
     inMap[d.second] ++
   }
 
   //g.addLink(d.first, d.second)
   console.log(d)
 })
 
 stream.on('end', () => {
   //const c = centrality.betweenness(g, true)
 
   const moreThan1InLink = reduce(inMap, (memo, n, key) => { 
     if (n > 1) {
       memo[key] = n
     }
     return memo
   }, {})
   
    const stream2 = db.searchStream([
      { subject: ego, predicate: 'follows', object: db.v('first') },
      { subject: db.v('first'), predicate: 'follows', object: db.v('second') }
    ])

    stream2.on('data', d => {
      if (!firstMap[d.first] && moreThan1InLink[d.first]) {
        g.addLink(ego, d.first)
        firstMap[d.first] = true
      }

      if (moreThan1InLink[d.second]) {
        g.addLink(d.first, d.second)
      }
    })

    stream2.on('end', () => {
      const c = centrality.betweenness(g)
      const s = sort(map(c, (v, k) => [k, v]), p => {
        return p[1]
      })
      console.log(s)
      console.log((Date.now() - start) / 1000, 'seconds')

    })

   console.log(moreThan1InLink)
 })
