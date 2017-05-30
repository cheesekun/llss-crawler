let superagent = require('superagent');
let cheerio = require('cheerio');
let fs = require('fs');
let logger = require('superagent-logger');

let items = [];
let msg = "";
let seed = "";

for (let i = 1; i < 46; i++) {
  // 设置爬取的网页，使用 get 请求
  superagent.get("http://www.hacg.wiki/wp/anime.html/page/" + i)
    .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36')
    .end(function (err, sres) {
      if (err) {
        next(err);
      }

      // 将请求网页存在 $ 变量中
      let $ = cheerio.load(sres.text);
      $(".type-post").each(function (idx, ele) {
        let title = $(ele).find(".entry-title a").text();
        let tags = $(ele).find('.entry-meta .tag-links');
        let id = $(ele).attr('id').slice(5);

        let tag = "";
        tags.each((idx, ele) => {

          // 获取所有 a 标签
          let as = $(ele).find('a');

          // 遍历 a标签 集合，获取其中的 text （内容物）
          as.each((idx, ele) => {
            tag += $(ele).text() + " , ";
          })
        })

        // 使用 promise 管理 回调函数 顺序
        let pro = new Promise(function (resolve, reject) {
          superagent.get('http://www.hacg.wiki/wp/' + id + '.html')
            .use(logger)
            .redirects(5)
            .end(function (err, sres) {
              let $ = cheerio.load(sres.text);
              let time = $('header time').text();
              // let author = $('.author a').text();

              // 将存放有 磁力链接 的 $('.entry-content') 去除标签并字符串化
              let all = $('.entry-content').text().toString();

              // 使用 正则表达式 匹配满足长度条件的 磁力链接
              if (all.match(/[0-9A-Za-z]{40}/) !== null) {
                seed = all.match(/[0-9A-Za-z]{40}/);
              } else if (all.match(/[0-9A-Za-z]{42}/) !== null) {
                seed = all.match(/[0-9A-Za-z]{42}/);
              } else if (all.match(/[0-9A-Za-z]{32}/) !== null) {
                seed = all.match(/[0-9A-Za-z]{32}/);
              }

              if (seed !== null) {
                resolve([time, seed])
              } else {
                resolve([time, "爬取不到"])
              }
            })

        })

        // 等上面的 回调函数 执行完，将爬取信息保存下来
        pro.then(function (content) {
          items.push({
            title: title,
            tags: tag,
            id: id,
            time: content[0],
            seed: content[1],
          });
          msg = `
            title: ${title}
            tags: ${tag} 
            id: ${id} 
            time: ${content[0]}
            seed: magnet:?xt=urn:btih:${content[1]}               
           `;
           msg = JSON.stringify(msg);
           
          // 将爬取信息插入到 msg.txt 文件中
          fs.appendFile("msg.txt", msg, function (err) {
            if (err) throw err;
          })
        }).catch(function (reject) {
          console.log("error")
        })
      })
    });
}
