package api

import (
	"kirklin/bing-mediator/api/helper"
	"kirklin/bing-mediator/common"
	"net/http"
	"strings"
)

func Index(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path == "/" {
		http.Redirect(w, r, common.PROXY_WEB_PAGE_PATH, http.StatusFound)
		return
	}
	if strings.HasPrefix(r.URL.Path, "/turing") {
		if !helper.CheckAuth(r) {
			helper.UnauthorizedResult(w)
			return
		}
	}
	common.NewSingleHostReverseProxy(common.BING_URL).ServeHTTP(w, r)

}
