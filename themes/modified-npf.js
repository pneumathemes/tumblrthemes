 // formats text blocks   
function createText(content) {
    let str = content.text.replaceAll('<', '&lt;')
    let texts = str.replaceAll('>', '&gt;')
    if (content.text === '') return ''
    let output = ''
    let paragraphs = texts.split(/\r?\n/)
    // Helper function to handle formatting tags
    function applyFormatting(texts, formatting) {
        let result = ''
        let characters = Array.from(texts.split(''))
        for (const [i, char] of characters.entries()) {
            const endFormatTypes = formatting.filter(f => f.end === i)
            for (const f of endFormatTypes) {
                if (f.type === 'link') result += '</a>'
                if (f.type === 'color') result += '</span>'
                if (f.type === 'bold') result += '</b>'
                if (f.type === 'small') result += '</span>'
                if (f.type === 'mention') result += '</a>'
                if (f.type === 'italic') result += '</i>'
            }

            const startFormatTypes = formatting.filter(f => f.start === i)
            for (const f of startFormatTypes) {
                if (f.type === 'link') result += `<a href="${f.url}">`
                if (f.type === 'color') result += `<span style="color:${f.hex}">`
                if (f.type === 'bold') result += '<b>'
                if (f.type === 'small') result += '<span style="font-size:.8rem">'
                if (f.type === 'mention') result += `<a class="mention" href="${f.blog.url}">`
                if (f.type === 'italic') result += '<i>'
            }
            result += char
        }
        return result
    }

    // Process each paragraph separately
    const finalOutput = document.createDocumentFragment();
    paragraphs.forEach(paragraph => {
        let formattedText = content.formatting ? applyFormatting(paragraph, content.formatting) : paragraph;

        if (content.subtype === 'unordered-list-item') {
            let li = document.createElement('li')
            li.classList.add(content.subtype)
            li.innerHTML = formattedText
            finalOutput.appendChild(li)
        } else {
            let p = document.createElement('p')
            p.classList.add(content.subtype)
            p.innerHTML = formattedText
            finalOutput.appendChild(p)
        }
    });

    return finalOutput;
}

// create audio posts 
function createAudio(content) {
    let audioWrapper = document.createElement('div')
    audioWrapper.classList.add('audio-wrapper')
    let audioPost = document.createElement('div')
    audioPost.classList.add('audio-container')
    audioWrapper.innerHTML = content.embed_html
    return audioWrapper
}

// create polls
function createPoll(content, permalink) {
    let id = permalink.substring(permalink.lastIndexOf("/") + 1);
    let poll = document.createElement('div')
    poll.classList.add('poll')
    poll.append(content.question)
    content.answers.map((answers) => {
        let answer = document.createElement('a')
        answer.classList.add('poll-option')
        answer.target = "_blank"
        answer.href = `https://tumblr.com/${ user }/${ id }`
        answer.innerHTML = answers.answer_text
        poll.append(answer)
    })
    return poll
}

// create links
function createLink(content) {
    let link = document.createElement('a')
    link.classList.add('post-link')
    link.href = content.url
    let poster = content.poster 
    let posterImage = document.createElement('div')
    posterImage.classList.add('poster-content')
    if (poster) {
        posterImage.classList.add('poster-with-image')
        posterImage.style.backgroundImage = `url(${content.poster[0].url})`
        posterImage.innerHTML = `<span class="link-title">${content.title} <i class="solar-icons" stroke="1.5" icon-name="arrow-right-square"></i>`
    } else {
        posterImage.innerHTML = `<b>${content.title}</b> <span><i class="solar-icons" stroke="1.5" icon-name="arrow-right-square"></i></span>`
    }
    link.append(posterImage)
    let linkDescription = document.createElement('div')
    linkDescription.classList.add('link-desc')
    if (content.description) {
        let description = document.createElement('span')
        description.textContent = content.description
        linkDescription.append(description)
    }
    let source = document.createElement('span')
    source.classList.add('link-source')
    source.innerHTML = `${content.site_name != null ? content.site_name : ''} | ${content.author != null ? content.author : ''}`
    linkDescription.append(source)
    if (content.author && content.site_name) link.append(linkDescription)
    return link
}

// create images (with lightbox support)

function createImage(media) {
     let image = document.createElement('img')
     let anchor = document.createElement('a')
     image.src = media.url
     anchor.classList.add('post_media_photo_anchor')
     anchor.setAttribute('data-big-photo', media.url)
     anchor.setAttribute('data-big-photo-height', media.height)
     anchor.setAttribute('data-big-photo-width', media.width)
     image.setAttribute('srcset', media.url)
     image.classList.add('post_media_photo', 'image')
     anchor.append(image)
     return anchor
}

// create content insie of each row  
function createRow(content, permalink) {
    // sort through content types      
    switch (content.type) {
        case 'text':
            let textWrapper = document.createElement('div')
            textWrapper.classList.add('text-content')
            textWrapper.append(createText(content))
            return textWrapper
            break;

        case 'image':
            return createImage(content.media[0])
            break;

        case 'audio':
            return createAudio(content)
            break;

        case 'link':
            return createLink(content)
            break;

        case 'video':
            if (content.provider === 'tumblr') {
                let video = document.createElement('video')
                video.src = content.url
                video.controls = true
                return video

            } else {
                let video = document.createElement('iframe')
                video.classList.add('video-iframe')
                video.src = content.embed_iframe?.url ?? content.media.url
                let videoWidth = content.embed_iframe?.width ?? content.media.width
                let videoHeight = content.embed_iframe?.height ?? content.media.height
                video.style.aspectRatio = `${ videoWidth } / ${ videoHeight }`
                return video
            }
            break;

        case 'poll':
            return createPoll(content, permalink)
            break;

        // in case there are new post types/types that were missed
        default:
            return `this ${content.type} npf block is not supported yet`
    }
}

// create each row  
function createRows(id, content, layout, permalink, trail = null) {
    let rows = document.createElement('div')
    rows.classList.add('content')
    // if there are indexes with asks 
    let asks = []
    // if there are layouts
    if (layout.length) {
        // if there are rows
        let hasRows = layout.every(v => v.type === 'rows');
        layout.map((layout) => {
            if (hasRows) {
                // if there are displays 
                if (layout.display) {
                    // create individual rows
                    layout.display.map((display) => {
                        let row = document.createElement('div')
                        row.classList.add(`flex`, `content-rows`, `row-size-${display.blocks.length}`)

                        // if there is inner content in a row 
                        if (display.blocks) {
                            display.blocks.map((block) => {
                                let innerRow = document.createElement('div')
                                innerRow.append(createRow(content[block], permalink))
                                row.append(innerRow)
                                rows.append(row)
                            })
                        }

                    })
                }

            }
            // if there are no rows
            else {
                // if layout is an ask
                if (layout.type === 'ask') {
                    let ask = document.createElement('div')
                    ask.classList.add('question')
                    let asker = document.createElement('a')
                    let askerIcon = document.createElement('div')
                    askerIcon.classList.add('asker-icon')
                    askerIcon.innerHTML = `<i class="solar-icons" stroke="1.5" icon-name="question-circle"></i>`
                    let askerHeader = document.createElement('div')
                    askerHeader.classList.add('asker-header')
                    asker.classList.add('asker')
                    askerHeader.append(askerIcon)
                    askerHeader.append(asker)
                    if (layout.attribution) {
                        asker.innerHTML = `${layout.attribution.blog.name}`
                    } else {
                        asker.innerHTML = `<span>anonymous asked</span>`
                    }
                    ask.append(askerHeader)
                    rows.classList.add('ask')
                    asks = layout.blocks
                    if (layout.blocks) {
                        layout.blocks.map((block) => {
                            ask.append(createRow(content[block], permalink))
                            rows.append(ask)
                        })
                    }
                }
            // if it is a reply
                if (!layout.display) {
                    // create styling for replies
                        let answer = document.createElement('div')
                            answer.classList.add('replies')
                            let asker = document.createElement('a')
                            asker.classList.add('asker')
                            let askerIcon = document.createElement('img')
                            askerIcon.classList.add('answerer-img')
                            let answererHeader = document.createElement('div')
                            answererHeader.classList.add('answerer-header')
                    // if answerer has a valid url
                    if (trail) {
                        asker.innerHTML = `${trail.name}`
                        askerIcon.src = `https://api.tumblr.com/v2/blog/${trail.name}/avatar/64`
                        answererHeader.append(askerIcon)
                        answererHeader.append(asker)
                        answer.append(answererHeader)
                    }  else asker.innerHTML = 'original reply'
                    
                    content.map((block, index) => {
                    // if block is not part of the original ask
                        if (asks.indexOf(index) === -1) {
                        // if the reply is part of a trail
                          if (trail) {
                            answer.append(createRow(block,permalink))
                            
                            rows.append(answererHeader, answer)   
                          }
                         // if reply is part of an original post 
                          else {
                              rows.append(createRow(block, permalink))
                          }
                        }
                    })
                }
            }
        })

    } else {
        content.map((block) => {
            rows.append(createRow(block, permalink))
        })
    }
    return rows
}

function postNotes(url) {
    let postNotesData = ""
    let postNotesDiv = document.createElement('div')
    let httpRequest = new XMLHttpRequest()
    httpRequest.onreadystatechange = function (data) {
        postNotesData = data.srcElement.response
    }
    httpRequest.open("GET", url)
    httpRequest.send()
    postNotesDiv.innerHTML = postNotesData
    return postNotesDiv
}

function createHeader(blogName, blogURL, active, tumblrmart_accessories) {
    // create reblog header link and avatar img
    let reblogHeader = document.createElement('a')
    reblogHeader.href = blogURL
    // let userAvatar = `<img class="user-avatar" src="https://api.tumblr.com/v2/blog/${ blogName }/avatar/64">`
    // will only show the image if a user is active
    reblogHeader.innerHTML = `<i class="solar-icons" stroke="1.5" icon-name="user-2"></i><span class="active-${ active } usernames">${ blogName }</span> `

    // determine if there are checkmarks
    let checkmarks = tumblrmart_accessories?.blue_checkmark_count
    if (checkmarks) {
        let checks = ''
        let checkmarkContainer = document.createElement('span')
        checkmarkContainer.classList.add('checkmarks')
        // checkmarks are 2 per purchase
        let total = checkmarks * 2
        // loop through each purchased checkmark + double it
        for (var i = 0; i < checkmarks * 2; i++) {
            // there are 12 official colors, if it is within the first 12, just use the index 
            if (i <= 11) {
                checks += `<span class="checkmark" style="left: calc( 0% + 80% * (${i + 1}/${ total })) "><img src="https://assets.tumblr.com/images/tumblrmart/badges/rainbow/${[ i + 1 ]}.png"></span>`
            }
            // if it's not, we do a little math
            else {
                // math is not my strength i apologize in advance
                let math = (i + 1) - ((Math.ceil((i + 1) / 12) - 1) * 12)
                checks += `<span class="checkmark" style="left: calc( 0% + 80%* (${i + 1}/${ total })) "><img src="https://assets.tumblr.com/images/tumblrmart/badges/rainbow/${ math }.png" ></span>`
            }
        }
        // add the checkmarks to the reblog header
        checkmarkContainer.innerHTML = checks
        // if there's more than 12, add some styling to prevent them from overflowing
        if (total > 12) {
            reblogHeader.classList.add('big-checkmarks')
        }
        reblogHeader.append(checkmarkContainer)
    }
    // return reblog header content
    return reblogHeader
}

// loop through each post in the array
for (const post of posts) {
    let npf = post.npf
    let permalink = post.permalink
    let article = document.createElement('article')
    let type = post.type
    article.id = `post-${ post.id }`
    article.classList.add(type)
    isPostReblogged = post.isReblogged;
    isPostPinned = post.isPinned;
    // if there is a reblog trail 
    if (npf.trail) {
        npf.trail.map((trail, index) => {
            // create header and content 
            let trailed = document.createElement('div')
            let header = document.createElement('div')
            if (index === 0) {
                header.classList.add('original-poster')
            }
            header.classList.add('reblog-header')
            if (trail.blog) {
                header.append(createHeader(trail.blog.name, trail.blog.url, trail.blog.can_be_followed, trail.blog.tumblrmart_accessories))
            } else {
                let brokenBlog = document.createElement('span')
                brokenBlog.classList.add('broken-blog', 'usernames')
                brokenBlog.innerHTML = trail.broken_blog_name
                header.append(brokenBlog)
            }
            trailed.append(createRows(post.id, trail.content, trail.layout, permalink, trail.blog))
            // add header and trail to the post element
            article.append(header, trailed)
        })
    }
    // if it is an original post  
    if (npf.content.length > 0) {
        let content = document.createElement('div')
        let header = document.createElement('div')
        header.classList.add('reblog-header', 'original-poster')
        header.append(createHeader(user, `https://${ user }.tumblr.com`, true, null))
        content.append(createRows(post.id, npf.content, npf.layout, permalink))
        article.append(header, content)
    }
    {block:IndexPage}
    // post info 
    let postInfo = document.createElement('div')
    postInfo.classList.add('post-info')
    
    if(isPostPinned){
        let pin = document.createElement('div')
        pin.classList.add('pinned-post')
        pin.innerHTML = `<i class="solar-icons" stroke="1.5" icon-name="pushpin"></i>`
        pin.setAttribute('title', 'pinned post')
        postInfo.append(pin)
    }
    
    let date = document.createElement('div')
    date.classList.add('date-info')
    date.innerHTML = `${post.date}`
    postInfo.append(date)
        
    if (post.noteCount) {
        let notecount = document.createElement('div')
        notecount.classList.add("notecount")
        notecount.innerHTML = `${post.noteCount}`
        postInfo.append(notecount)
    }
    
    if(isPostReblogged){
        let rebloginfoContainer = document.createElement('div')
        rebloginfoContainer.classList.add('reblog-info-container')
        parentURL = document.createElement('a')
        parentURL.href = post.reblogParentURL
        parentURL.title = `via: ${post.reblogParentName}`
        parentPic = document.createElement('img')
        parentPic.src=post.reblogParentPhoto
        parentURL.append(parentPic)
        rootURL = document.createElement('a')
        rootURL.href=post.reblogRootURL
        rootURL.title=`src: ${post.reblogRootName}`
        rootPic = document.createElement('img')
        rootPic.src=post.reblogRootPhoto
        rootURL.append(rootPic)
        rebloginfoContainer.append(parentURL)
        rebloginfoContainer.append(rootURL)
        postInfo.append(rebloginfoContainer)
    }
    
    let reblogControl = document.createElement('div')
    reblogControl.classList.add('controls')
    reblogLink = document.createElement('a')
    reblogLink.href=post.reblogLink
    reblogLink.title="reblog this post"
    reblogLink.innerHTML = `<i class="solar-icons" stroke="1.5" icon-name="refresh"></i>`
    likeButton = document.createElement('a')
    likeButton.href='#'
    likeButton.classList.add('like')
    likeButton.title="like this post"
    likeButton.innerHTML = `{LikeButton} <i class="solar-icons" stroke="1.5" icon-name="heart-1"></i>`
    permalinkButton = document.createElement('a')
    permalinkButton.href=permalink
    permalinkButton.title="permalink page"
    permalinkButton.innerHTML=`<i class="solar-icons" stroke="1.5" icon-name="bookmark"></i>`
    reblogControl.append(reblogLink)
    reblogControl.append(likeButton)
    reblogControl.append(permalinkButton)
    postInfo.append(reblogControl)
    
    article.append(postInfo)
    {/block:IndexPage}
    
    // tags
    {block:IndexPage}
    if (post.tags) {
         let tagged = document.createElement('div')
        tagged.classList.add('tags')  
        for (let tag of post.tags) {
            let tagLink = document.createElement('span')
            let tagContent = `<a href="/tagged/${ tag }">#${ tag }</a>`
            tagLink.innerHTML = tagContent
            tagged.append(tagLink)
        }
        article.append(tagged)
    }
    {/block:IndexPage}
    
    if (permalink === window.location.href) {
        let postInfoPermalink = document.createElement('div')
        postInfoPermalink.classList.add('post-info-permalink')
        let permalinkDate = document.createElement('div')
        permalinkDate.classList.add('date-permalink')
        permalinkDate.innerHTML = `Timestamp: ${post.permalinkPage}`
        postInfoPermalink.append(permalinkDate)
        if(isPostReblogged){
            let rebloggedPostInfo = document.createElement('div')
            rebloggedPostInfo.classList.add('permalink-reblog-info')
            let reblogParent = document.createElement('a')
            let reblogRoot = document.createElement('a')
            reblogParent.href = post.reblogParentURL
            reblogParent.innerHTML = post.reblogParentName
            reblogRoot.href = post.reblogRootURL
            reblogRoot.innerHTML = post.reblogRootName
            rebloggedPostInfo.innerHTML = "reblogged via " + reblogParent.outerHTML + ", originally from " + reblogRoot.outerHTML
            postInfoPermalink.append(rebloggedPostInfo)
        }
        article.append(postInfoPermalink)
        pagination.append(postNotes(post.postNotes));
    }
        // if ask or submit pages 
    if (bodyElement.contains('askpermalink-page') || bodyElement.contains('submit-permalink-page')) {
        let inbox = document.createElement('div')
        inbox.classList.add('text-content')
        inbox.innerHTML = post.inboxBody
        article.append(inbox)
    }
    // append post element to container
    container.append(article)
}
