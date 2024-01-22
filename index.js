// Octokit.js
// https://github.com/octokit/core.js#readme

import { Octokit } from "https://esm.sh/@octokit/core";

const octokit = new Octokit({})

let numberOfPages = 0;
let currentPage = 1
let username = ""

$('#getValueButton').on('click', function () {
  username = $('#username').val()
  getRepositoryAndUserDetails()
})

//how will you render if you know the pageurl
// you have a page url. first fetch data from that url 
// send that data to render function which will rerender the data

const onPageClick = async (pageNumber) => {
  currentPage = pageNumber
  $("#previous").removeClass("disabled")
  $("#next").removeClass("disabled")
  if (currentPage == 1) {
    $("#previous").addClass("disabled")
  }

  if (currentPage == numberOfPages) {
    $("#next").addClass("disabled")
  }

  if (currentPage > 1 && currentPage < numberOfPages) {
    $("#previous").removeClass("disabled")
    $("#next").removeClass("disabled")
  }
  console.log("onPageClick fire")
  console.log(currentPage)
  $(`#pages > li`).removeClass("active")
  $(`#pages li:nth-child(${currentPage})`).addClass("active")
  const response = await fetchUri()
  renderRepositoriesInUI(response.data)
}

const renderPages = (numberOfPages) => {
  // create a ul with x number of li
  const list = $("#pages")
  list.empty()
  for (let i = 0; i < numberOfPages; i++) {
    list.append(`<li class="page-item"><button class="page-link">${i + 1}</button></li>`)
    $("#pages li:last-child button").on('click', function () {
      onPageClick(i + 1)
    })
  }
}


const getRepositoryAndUserDetails = async () => {
  const { data: user } = await octokit.request(`GET /users/${username}`)
  $('#name').text(user.name)
  $('#user-bio').text(user.bio || 'Bio')
  $('#location').text(user.location)
  $('#bio').text(user.bio || 'Bio or additional information about the user.');
  $('#followers').text(user.followers);
  $('#following').text(user.following);
  $('#github-url').text(user.html_url)
  $('#github-url').attr('href', user.html_url)
  $('#profile-avatar').attr('src', user.avatar_url)

  const repoResponse = await fetchUri()
  if (repoResponse.error) return

  const data = repoResponse.data
  numberOfPages = getLastPage(repoResponse.headers.link)
  renderPages(numberOfPages)
  renderRepositoriesInUI(data)
  currentPage = 1
  $(`#pages li:nth-child(${currentPage})`).addClass("active")
}

$('#next').on('click', async function () {
  if (currentPage == numberOfPages) {
    return
  }

  $("#previous").removeClass("disabled")
  $("#next").removeClass("disabled")
  currentPage++;
  if (currentPage == numberOfPages) {
    console.log('disabling the next button')
    $("#next").addClass("disabled")
  }

  $(`#pages > li`).removeClass("active")
  $(`#pages li:nth-child(${currentPage})`).addClass("active")
  const response = await fetchUri()
  if (response.error) return
  renderRepositoriesInUI(response.data)
})

$('#previous').on('click', async function () {
  if (currentPage == 1) {
    return
  }

  $("#previous").removeClass("disabled")
  $("#next").removeClass("disabled")
  currentPage--;
  if (currentPage == 1) {
    console.log('adding disabled')
    $("#previous").addClass("disabled")
  }

  $(`#pages > li`).removeClass("active")
  $(`#pages li:nth-child(${currentPage})`).addClass("active")
  const response = await fetchUri()
  if (response.error) return
  renderRepositoriesInUI(response.data)
})

const fetchUri = async () => {
  $("#loading").removeClass("d-none")
  $("#loading").addClass("d-block");

  try {
    const response = await octokit.request(`GET /users/${username}/repos`, {
      per_page: 10,
      page: currentPage,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    console.log(response);
    return response;
  } catch (error) {
    console.error('Error fetching data:', error);
  } finally {
    // This block will always execute, even if there's an error
    $("#loading").removeClass("d-block");
    $("#loading").addClass("d-none");
  }
};

const renderRepositoriesInUI = (repos) => {
  const reposDiv = repos.map(repo => (
    `<div class="card col-md-5 mb-4">
        <div class="card-body mb-5">
            <h3 class="card-title ">${repo.name}</h3>
            <p class="card-text">${repo.description ? repo.description : "No Description"}</p>
        </div>
        <p class="card-footer bg-success text-white"><b>${repo.language || 'Language Not Specified'}</b></p>
      </div>
    `
  ))

  $("#repositories").empty()

  reposDiv.forEach(div => {
    $("#repositories").append(div)
  })
}

function getLastPage(linkHeader) {
  // Using regular expression to find the last page parameter in the link header
  const match = linkHeader.match(/[?&]page=(\d+)[^&]*[>;] rel="last"/);

  if (match) {
    return Number(match[1]);
  } else {
    return 0;
  }
}