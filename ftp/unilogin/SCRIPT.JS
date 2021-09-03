 authenticate_UNI_mobile: function (username, password, callback) {
            console.log("Authenticate uni mobile");
            var wsBrugerid = "wscadppl";
            var UTCtime = new Date().getTime() / 1000;
            var kontekst = "A03790";
            var projekt = "frontread";
            var BrugerId = username;
            var wsPassword = "kiLPqsQnUn3bbEY";
            var brugerpassword = password;
            var k0_1 = CryptoJS.SHA1(wsPassword);
            k0_1 = k0_1.toString(CryptoJS.enc.Base64);
            var k0_2 = CryptoJS.SHA1(brugerpassword);
            k0_2 = k0_2.toString(CryptoJS.enc.Base64);
            var k0 = k0_1 + k0_2;
            var M0 = UTCtime + kontekst + projekt + BrugerId;
            var hmachash = CryptoJS.HmacSHA1(M0, k0);
            var Auth = hmachash.toString();
            var url = "https://auth.emu.dk/mauth/?";
            var data = "wsBrugerid=" + wsBrugerid + "&wsPassword=" + wsPassword + "&UTCtime=" + UTCtime + "&kontekst=" + kontekst + "&projekt=" + projekt + "&BrugerId=" + BrugerId + "&Auth=" + Auth + "&callback=?";
            var request = new XMLHttpRequest();
            request.open("GET", url + data, true);
            request.onreadystatechange = function () {
                if (request.readyState == 4) {
                    if (request.status == 200 || request.status == 0) {
                        var res = request.responseText == "" ? { VALID: 0 } : JSON.parse(request.responseText);
                        //From Uni-logins documentation on request.responseText.VALID:
                        ///Et tal reprÃ¦senteret som tegnstreng, og en af:
                        ///"-3": Systemfejl, rapporter venligst til UNIâ€¢C, unilogin-appl@uni-c.dk sammen med tidspunkt og detaljer i kald.
                        ///"-2": Timestamp fejl - dvs. Auth er forÃ¦ldet.
                        ///"-1": Brugerid er ikke tilmeldt app - dvs. har ikke licens til projektet.
                        ///"0": Brugerid/Password er forkert.
                        ///"1": Brugerid/Password er korrekt, og bruger har licens til projektet.
                        ///We choose to sort on the server if they are valid users to in have to option on the server to
                        ///circumvent the uni-login "unlicensed users" error. Currently holstebro vuc does this
                        if (res.VALID == 1 || res.VALID == -1) {
                            console.log("unic mobile authentication success");
                            //self.autenticate_frontread(username, config.common_unic_user_password, callback);
                            App.askForGroupId = true;
                            App.UserProfile.userType = "UNI";
                            callback(null, { status: request.status });
                        }
                        else if (res.VALID == 0) {
                            console.error("VALID == 0 data: " + data);
                            console.error("VALID == 0 uni mobile login failed " + username + ", res " + JSON.stringify(res));
                            console.error("VALID == 0 request " + JSON.stringify(request));
                            callback(true, { status: 403 }); // unic- login fail special error status code.
                        }
                        else {
                            //callback('error: login faled')
                            console.error("data: " + data);
                            console.error("uni mobile login failed " + username + ", res " + JSON.stringify(res));
                            console.error("request " + JSON.stringify(request));
                            callback(true, { status: 522 }); // unic- login fail special error status code.
                        }
                    }
                }
            };
            request.send();
        },
        //contacting unic to get token
        authenticate_UNI_web: function () {
            console.log("Lang UNI Web: " + config.language);
            var id = config.uniID;
            var secret = config.uniSecret;
            var returnURL = config.uniWebReturnUrl();
            var path = this.URI_ESCAPE(this.BASE64(returnURL));
            var auth = this.MD5(returnURL + secret);
            window.location.href = "https://sli.emu.dk/unilogin/login.cgi?id={0}&path={1}&auth={2}".format(id, path, auth);
        },
        // check unic token and if group is still stored and its not a refresh
        isAuthenticatedBy_UNI_web: function () {
            var secret = config.uniSecret;
            var params = getUrlParams();
            App.askForGroupId = true;
            App.UserProfile.userType = "UNI";
            return params.auth == this.MD5(params.timestamp + secret + params.user);
        },
