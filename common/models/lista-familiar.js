'use strict';

module.exports = function(Listafamiliar) {

	// Asignar como 'owner' de la lista que se va a crear, al usuario que solicita su creación
    Listafamiliar.beforeRemote('create', function (context, listaFamiliar, next) {
        context.args.data.owner = context.req.accessToken.userId;
        next();
    });
  
	// Asignar el id de la lista recién creada, al usuario que la creó
    Listafamiliar.afterRemote('create', function (context, listaFamiliar, next) {
    	listaFamiliar.propietario(function(err, usuario){
    		if(err) next(err);
    		usuario.listaFamiliarId = listaFamiliar.id;
    		usuario.save(function(err, usuario){
    			if(err) next(err);
    			next();
    		})
    	})
    });

	// Eliminar cualquier solicitud anterior del usuario
	Listafamiliar.afterRemote('prototype.solicitar', function(context, listaFamiliar, next) {
		var Usuario = Listafamiliar.app.models.Usuario;
		var userId = context.req.accessToken.userId;
		var async = require('async');

		Usuario.findById(userId, function(err, usuario) {
			if (err) next(err);
			usuario.solicitudes(function(err, solicitudes) {
				if (err) next(err);

				async.each(solicitudes,function(listaSolicitada, cb) {
					if (listaSolicitada.id != listaFamiliar.listaFamiliarId) {
						usuario.solicitudes.remove(listaSolicitada, function(err) {
							if (err) cb(err);
							cb();
						});
					} else {
						cb();
					}
				}, function(err) {
					if (err) next(err);
					next();
				});
			});
		});

	});

	/**
	 * Añade una solicitud, del usuario autenticado, a la lista familiar seleccionada.
	 * @param {object} contexto El objeto del contexto
	 * @param {Function(Error, object)} callback
	 */

	Listafamiliar.prototype.solicitar = function(contexto, callback) {
		var solicitud;
		var listaFamiliar = this;
		var userId = contexto.req.accessToken.userId;
		
		listaFamiliar.solicitudes.add(userId,
			function(err) {
				if(err) callback(err);
				solicitud = {
					listaFamiliarId: listaFamiliar.id,
					usuarioId: userId
				}
				callback(null, solicitud);
			}
		);
	};
};
